import { AppDataSource } from '../database/data-source.js';
import { UserOnlineTime } from '../database/entities/user-online-time.js';

interface DailyOnlineTimeRow {
  date: string; // YYYY-MM-DD
  minutes: number;
}

class UserOnlineTimeService {
  private repo = AppDataSource.getRepository(UserOnlineTime);

  /**
   * Get all online time records for a user (reverse chronological)
   */
  async getUserOnlineTime(userId: number): Promise<DailyOnlineTimeRow[]> {
    const records = await this.repo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
    });

    return records.map((r) => ({
      date: r.date,
      minutes: r.minutes,
    }));
  }

  /**
   * Add or update online time for a specific date
   */
  async recordDailyOnlineTime(userId: number, date: string, minutes: number): Promise<DailyOnlineTimeRow> {
    // Try to find existing record for this date
    const existing = await this.repo.findOne({
      where: { user_id: userId, date },
    });

    if (existing) {
      // Update existing record
      existing.minutes = minutes;
      await this.repo.save(existing);
      return { date: existing.date, minutes: existing.minutes };
    } else {
      // Create new record
      const record = this.repo.create({
        user_id: userId,
        date,
        minutes,
      });
      const saved = await this.repo.save(record);
      return { date: saved.date, minutes: saved.minutes };
    }
  }

  /**
   * Add to existing online time for a date (for incremental updates)
   */
  async addToOnlineTime(userId: number, date: string, minutesToAdd: number): Promise<DailyOnlineTimeRow> {
    const existing = await this.repo.findOne({
      where: { user_id: userId, date },
    });

    if (existing) {
      existing.minutes += minutesToAdd;
      await this.repo.save(existing);
      return { date: existing.date, minutes: existing.minutes };
    } else {
      const record = this.repo.create({
        user_id: userId,
        date,
        minutes: minutesToAdd,
      });
      const saved = await this.repo.save(record);
      return { date: saved.date, minutes: saved.minutes };
    }
  }

  /**
   * Get total playtime in minutes for a user
   */
  async getTotalPlaytime(userId: number): Promise<number> {
    const records = await this.repo.find({
      where: { user_id: userId },
    });
    return records.reduce((sum, r) => sum + r.minutes, 0);
  }
}

export const userOnlineTimeService = new UserOnlineTimeService();
