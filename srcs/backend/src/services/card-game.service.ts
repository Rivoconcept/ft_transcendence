import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";
import { socketService } from "../websocket.js";

interface CreateCardGameDTO {
  mode?: CardGameMode;
  final_score?: number;
  is_win?: boolean;
  match_id: string;
  player_name: string;
}

interface FinishSingleCardGameDTO {
  final_score?: number;
  is_win?: boolean;
  player_name: string;
}

class CardGameService {
  private repo = AppDataSource.getRepository(CardGame);
  private matchRepository = AppDataSource.getRepository(Match);
  private participationRepository = AppDataSource.getRepository(Participation);


  async createCardGame(userId: number, data: CreateCardGameDTO) {
    const card = this.repo.create({
      author_id: userId,
      mode: data.mode ?? CardGameMode.SINGLE,
      final_score: data.final_score ?? 0,
      is_win: data.is_win ?? false,
      match_id: data.match_id,
      player_name: data.player_name,
    } as Partial<CardGame>);

    await this.repo.save(card);
    return card;
  }

  async finishSingleGame(userId: number, data: FinishSingleCardGameDTO) {
    const singleMatchId = Math.random().toString(36).substring(2, 6);

    const card = this.repo.create({
      author_id: userId,
      mode: CardGameMode.SINGLE,
      final_score: data.final_score ?? 0,
      is_win: data.is_win ?? false,
      match_id: singleMatchId,
      player_name: data.player_name,
    } as Partial<CardGame>);

    await this.repo.save(card);

    const io = socketService.getIO();
    if (io) {
      io.to(`user.${userId}`).emit("game-history:updated", {
        userId,
        game: CardGameMode.SINGLE,
      });
    }

    return card;
  }

  async getByUser(userId: number) {
    return this.repo.find({
      where: { author_id: userId },
      order: { created_at: "DESC" },
    });
  }

  async getMatchResults(matchId: string) {
    return this.repo.find({
      where: { match_id: matchId },
      order: { final_score: "DESC" },
      select: ["player_name", "final_score", "is_win"],
    });
  }

  async getLastSingleResult(userId: number) {
    return this.repo.findOne({
      where: {
        author_id: userId,
        mode: CardGameMode.SINGLE,
      },
      order: { created_at: "DESC" },
      select: ["player_name", "final_score", "is_win"],
    });
  }

  async finishMatch(matchId: string) {
      await this.repo.query(`
        UPDATE card_game
        SET is_win = false
        WHERE match_id = $1
      `, [matchId]);

      await this.repo.query(`
          WITH stats AS (
            SELECT 
              match_id,
              COUNT(*) AS cnt,
              MAX(final_score) AS max_score
            FROM card_game
            WHERE match_id = $1
            GROUP BY match_id
          )
          UPDATE card_game cg
          SET is_win = CASE
            WHEN stats.cnt = 1 THEN (cg.final_score > 0)
            WHEN cg.final_score = stats.max_score THEN true
            ELSE false
          END
          FROM stats
          WHERE cg.match_id = stats.match_id
            AND cg.match_id = $1;
      `, [matchId]);

    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });
    const participantIds = participations.map((p) => p.user_id);

    if (match && !match.match_over) {
      match.match_over = true;
      match.is_open = false;
      await this.matchRepository.save(match);
    }

    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:ended", {
        matchId,
        current_set: match?.current_set ?? 1,
        participantIds,
      });

      participantIds.forEach((userId) => {
        io.to(`user.${userId}`).emit("game-history:updated", {
          userId,
          game: CardGameMode.MULTI,
          matchId,
        });
      });
    }

    participantIds.forEach((id) => {
      socketService.leaveMatchRoom(id, matchId);
    });
  }
  
}

export const cardGameService = new CardGameService();
