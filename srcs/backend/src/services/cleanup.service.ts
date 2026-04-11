import { LessThan } from "typeorm";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../database/entities/user.js";

class CleanupService {
  private userRepository = AppDataSource.getRepository(User);

  async removeUnconfirmedUsers(): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const users = await this.userRepository.find({
      where: {
        is_confirmed: false,
        created_at: LessThan(oneDayAgo),
      },
    });

    if (users.length === 0) return 0;

    await this.userRepository.remove(users);
    return users.length;
  }
}

export const cleanupService = new CleanupService();
