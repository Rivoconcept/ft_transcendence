import { AppDataSource } from "../database/data-source.js";
import { User } from "../database/entities/user.js";
import { Invitation, InvitationStatus } from "../database/entities/invitation.js";

class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private invitationRepository = AppDataSource.getRepository(Invitation);

  async getById(userId: number): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getByUsername(username: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(
    userId: number,
    data: { realname?: string; avatar?: string }
  ): Promise<Partial<User> | null> {
    await this.userRepository.update(userId, data);
    return this.getById(userId);
  }

  async setOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await this.userRepository.update(userId, { is_online: isOnline });

    const friends = await this.getFriends(userId);

    // Dynamic import to avoid circular dependency
    const { socketService } = await import("../websocket.js");
    const io = socketService.getIO();
    if (io) {
      for (const friend of friends) {
        io.to(`user.${friend.id}`).emit("friend:status", {
          userId,
          isOnline,
        });
      }
    }
  }

  async getFriends(userId: number): Promise<Partial<User>[]> {
    const invitations = await this.invitationRepository.find({
      where: [
        { sender_id: userId, status: InvitationStatus.ACCEPTED },
        { receiver_id: userId, status: InvitationStatus.ACCEPTED },
      ],
      relations: ["sender", "receiver"],
    });

    const friends: Partial<User>[] = [];

    for (const invitation of invitations) {
      const friend = invitation.sender_id === userId
        ? invitation.receiver
        : invitation.sender;

      const { password: _, ...friendWithoutPassword } = friend;
      friends.push(friendWithoutPassword);
    }

    return friends;
  }
}

export const userService = new UserService();
