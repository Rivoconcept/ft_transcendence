import { In } from 'typeorm';
import { AppDataSource } from "../database/data-source.js";
import { Participation } from "../database/entities/participation.js";
import { KodWinner } from '../database/entities/KodRound.js';
import { User } from '../database/entities/user.js';

export interface KodGameApiRow {
  id: number;
  match_id: string;
  is_win: boolean;
  player_name: string;
  remaining_points: number;
  total_rounds: number;
  created_at: string;
  mode: 'SINGLE' | 'MULTI';
}

export interface KodMatchParticipant {
  player_name: string;
}

export class KodGamesService {
  private participationRepo = AppDataSource.getRepository(Participation);
  private kodWinnerRepo = AppDataSource.getRepository(KodWinner);
  private userRepo = AppDataSource.getRepository(User);

  async getKodGames(userId: number): Promise<KodGameApiRow[]> {
    // 1. All matches the user participated in
    const participations = await this.participationRepo.find({
      where: { user_id: userId },
    });

    if (participations.length === 0) return [];

    const matchIds = participations.map((p) => p.match_id);

    // 2. KodWinner rows for those matches
    const winners = await this.kodWinnerRepo.find({
      where: { match_id: In(matchIds) },
      order: { created_at: 'DESC' },
    });

    // 3. Participant counts per match → SINGLE vs MULTI
    const countRows = await this.participationRepo
      .createQueryBuilder('p')
      .select('p.match_id', 'match_id')
      .addSelect('COUNT(*)', 'count')
      .where('p.match_id IN (:...matchIds)', { matchIds })
      .groupBy('p.match_id')
      .getRawMany<{ match_id: string; count: string }>();

    const countMap = new Map(
      countRows.map((r) => [r.match_id, parseInt(r.count, 10)])
    );

    // 4. Current user's username
    const user = await this.userRepo.findOneByOrFail({ id: userId });

    return winners.map((w) => ({
      id: w.id,
      match_id: w.match_id,
      is_win: w.winner_user_id === userId,
      player_name: user.username,
      remaining_points: w.remaining_points,
      total_rounds: w.total_rounds,
      created_at: w.created_at.toISOString(),
      mode: (countMap.get(w.match_id) ?? 1) > 1 ? 'MULTI' : 'SINGLE',
    }));
  }

  async getKodMatchParticipants(match_id: string): Promise<KodMatchParticipant[]> {
    const participations = await this.participationRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.match_id = :match_id', { match_id })
      .getMany();

    return participations.map((p) => ({
      player_name: p.user.username,
    }));
  }
}

// Singleton export — mirrors the pattern your apiService likely uses
export const kodGamesService = new KodGamesService();