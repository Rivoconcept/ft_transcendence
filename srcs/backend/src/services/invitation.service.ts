import { AppDataSource } from "../database/data-source.js";
import { Invitation, InvitationStatus } from "../database/entities/invitation.js";
import { User } from "../database/entities/user.js";
import { socketService } from "../websocket.js";

class InvitationService {
  private invitationRepository = AppDataSource.getRepository(Invitation);
  private userRepository = AppDataSource.getRepository(User);

  async sendInvitation(senderId: number, receiverUsername: string): Promise<Invitation> {
    const receiver = await this.userRepository.findOne({
      where: { username: receiverUsername },
    });

    if (!receiver) {
      throw new Error("User not found");
    }

    if (receiver.id === senderId) {
      throw new Error("Cannot send invitation to yourself");
    }

    // Vérifier si une invitation existe déjà (dans les deux sens)
    const existingInvitation = await this.invitationRepository.findOne({
      where: [
        { sender_id: senderId, receiver_id: receiver.id },
        { sender_id: receiver.id, receiver_id: senderId },
      ],
    });

    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.ACCEPTED) {
        throw new Error("You are already friends");
      }
      if (existingInvitation.status === InvitationStatus.PENDING) {
        throw new Error("Invitation already pending");
      }
    }

    const invitation = this.invitationRepository.create({
      sender_id: senderId,
      receiver_id: receiver.id,
      status: InvitationStatus.PENDING,
    });

    await this.invitationRepository.save(invitation);

    // Notifier le destinataire via socket (si initialisé)
    const io = socketService.getIO();
    if (io) {
      io.to(`user.${receiver.id}`).emit("invitation:received", {
        invitationId: invitation.id,
        senderId,
      });
    }

    return invitation;
  }

  async acceptInvitation(invitationId: number, userId: number): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, receiver_id: userId, status: InvitationStatus.PENDING },
      relations: ["sender", "receiver"],
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    // Notifier l'expéditeur que l'invitation est acceptée (si initialisé)
    const io = socketService.getIO();
    if (io) {
      io.to(`user.${invitation.sender_id}`).emit("invitation:accepted", {
        invitationId: invitation.id,
        friendId: userId,
      });
    }

    return invitation;
  }

  async declineInvitation(invitationId: number, userId: number): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, receiver_id: userId, status: InvitationStatus.PENDING },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    invitation.status = InvitationStatus.DECLINED;
    await this.invitationRepository.save(invitation);

    // Notifier l'expéditeur (si initialisé)
    const io = socketService.getIO();
    if (io) {
      io.to(`user.${invitation.sender_id}`).emit("invitation:declined", {
        invitationId: invitation.id,
      });
    }
  }

  async getPendingInvitations(userId: number): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { receiver_id: userId, status: InvitationStatus.PENDING },
      relations: ["sender"],
    });
  }

  async getSentInvitations(userId: number): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { sender_id: userId, status: InvitationStatus.PENDING },
      relations: ["receiver"],
    });
  }

  async getFriendIds(userId: number): Promise<number[]> {
    const friendships = await this.invitationRepository.find({
      where: [
        { sender_id: userId, status: InvitationStatus.ACCEPTED },
        { receiver_id: userId, status: InvitationStatus.ACCEPTED },
      ],
    });

    return friendships.map((f) =>
      f.sender_id === userId ? f.receiver_id : f.sender_id
    );
  }

  async getNonFriendIds(
    userId: number,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{ userIds: number[]; total: number; hasMore: boolean }> {
    // Récupérer les IDs des amis et des invitations en cours
    const existingRelations = await this.invitationRepository.find({
      where: [
        { sender_id: userId },
        { receiver_id: userId },
      ],
    });

    const excludedIds = new Set<number>([userId]);
    for (const rel of existingRelations) {
      excludedIds.add(rel.sender_id);
      excludedIds.add(rel.receiver_id);
    }

    // Requête pour les utilisateurs non-amis
    let query = this.userRepository.createQueryBuilder("user")
      .select("user.id")
      .where("user.id NOT IN (:...excludedIds)", { excludedIds: [...excludedIds] });

    if (search) {
      query = query.andWhere(
        "(user.username ILIKE :search OR user.realname ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const total = await query.getCount();
    const offset = (page - 1) * limit;

    const users = await query
      .orderBy("user.username", "ASC")
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      userIds: users.map((u) => u.id),
      total,
      hasMore: offset + users.length < total,
    };
  }
}

export const invitationService = new InvitationService();
