import { AppDataSource } from "../database/data-source.js";
import { BlockedUser } from "../database/entities/blocked-user.js";
import { Invitation, InvitationStatus } from "../database/entities/invitation.js";
import { socketService } from "../websocket.js";

const blockRepo = AppDataSource.getRepository(BlockedUser);
const invitationRepo = AppDataSource.getRepository(Invitation);

export async function blockUser(blockerId: number, blockedId: number): Promise<BlockedUser> {
  const existing = await blockRepo.findOne({
    where: { blocker_id: blockerId, blocked_id: blockedId },
  });
  if (existing) {
    throw new Error("User already blocked");
  }

  // Supprimer l'amitié (invitations accepted dans les deux sens)
  const deletedFriendship = await invitationRepo.findOne({
    where: [
      { sender_id: blockerId, receiver_id: blockedId, status: InvitationStatus.ACCEPTED },
      { sender_id: blockedId, receiver_id: blockerId, status: InvitationStatus.ACCEPTED },
    ],
  });

  await invitationRepo.delete([
    { sender_id: blockerId, receiver_id: blockedId, status: InvitationStatus.ACCEPTED },
    { sender_id: blockedId, receiver_id: blockerId, status: InvitationStatus.ACCEPTED },
  ]);

  // Supprimer les invitations en attente dans les deux sens
  await invitationRepo.delete([
    { sender_id: blockerId, receiver_id: blockedId, status: InvitationStatus.PENDING },
    { sender_id: blockedId, receiver_id: blockerId, status: InvitationStatus.PENDING },
  ]);

  // Notifier l'utilisateur bloqué que l'amitié a été supprimée
  if (deletedFriendship) {
    const io = socketService.getIO();
    if (io) {
      io.to(`user.${blockedId}`).emit("friend:removed", { friendId: blockerId });
    }
  }

  const block = blockRepo.create({ blocker_id: blockerId, blocked_id: blockedId });
  return blockRepo.save(block);
}

export async function unblockUser(blockerId: number, blockedId: number): Promise<void> {
  const existing = await blockRepo.findOne({
    where: { blocker_id: blockerId, blocked_id: blockedId },
  });
  if (!existing) {
    throw new Error("User is not blocked");
  }
  await blockRepo.remove(existing);
}

export async function getBlockedUsers(userId: number): Promise<number[]> {
  const blocks = await blockRepo.find({
    where: { blocker_id: userId },
    select: ["blocked_id"],
  });
  return blocks.map(b => b.blocked_id);
}

export async function isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
  const block = await blockRepo.findOne({
    where: { blocker_id: blockerId, blocked_id: blockedId },
  });
  return !!block;
}
