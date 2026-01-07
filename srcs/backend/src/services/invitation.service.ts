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
}

export const invitationService = new InvitationService();
