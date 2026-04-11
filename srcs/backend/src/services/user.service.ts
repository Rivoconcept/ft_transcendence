import bcrypt from "bcrypt";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../database/entities/user.js";
import { Invitation, InvitationStatus } from "../database/entities/invitation.js";
import { Participation } from "../database/entities/participation.js";
import { Match } from "../database/entities/match.js";

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
    data: { username?: string; email?: string; avatar?: string }
  ): Promise<Partial<User> | null> {
    if (data.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Username already exists");
      }
    }

    await this.userRepository.update(userId, data);
    return this.getById(userId);
  }

  async getUserProfile(userId: number): Promise<{
    id: number;
    username: string;
    avatar: string;
    is_online: boolean;
    gamesPlayed: number;
    wins: number;
    losses: number;
  } | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const participationRepo = AppDataSource.getRepository(Participation);

    const participations = await participationRepo.find({
      where: { user_id: userId },
      relations: ["match", "match.participations"],
    });

    const finishedParticipations = participations.filter(p => p.match?.match_over);
    const gamesPlayed = finishedParticipations.length;

    let wins = 0;
    let losses = 0;

    for (const p of finishedParticipations) {
      const allScores = p.match.participations;
      const maxScore = Math.max(...allScores.map(s => s.score));
      if (p.score === maxScore) {
        wins++;
      } else {
        losses++;
      }
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      is_online: user.is_online,
      gamesPlayed,
      wins,
      losses,
    };
  }

  async getByEmail(email: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async resetPassword(userId: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
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
