// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/services/card-game.service.ts
import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";
import { Match } from "../database/entities/match.js";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";

interface CreateCardGameDTO {
  mode?: CardGameMode;
  final_score?: number;
  is_win?: boolean;
  match_id: string;
  player_name: string;
}

class CardGameService {
  private repo = AppDataSource.getRepository(CardGame);
  private matchRepository = AppDataSource.getRepository(Match);

  // Crée une partie

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

  // Récupère les parties d'un utilisateur

  async getByUser(userId: number) {
    return this.repo.find({
      where: { author_id: userId },
      order: { created_at: "DESC" },
    });
  }

  // Récupère les résultats d'un match (multiplayer)

  async getMatchResults(matchId: string) {
    return this.repo.find({
      where: { match_id: matchId },
      order: { final_score: "DESC" },
      select: ["player_name", "final_score", "is_win"],
    });
  }

  // Récupère la dernière partie SINGLE d'un utilisateur

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
    // reset
    await this.repo.query(`
      UPDATE card_game
      SET is_win = false
      WHERE match_id = $1
    `, [matchId]);

    // winner(s)
    await this.repo.query(`
      UPDATE card_game
      SET is_win = true
      WHERE match_id = $1
      AND final_score = (
        SELECT MAX(final_score)
        FROM card_game
        WHERE match_id = $1
      )
    `, [matchId]);

    // Get the winner and update Match record
    const winners = await this.repo.find({
      where: { match_id: matchId, is_win: true },
    });

    if (winners.length > 0) {
      const winner = winners[0];
      const match = await this.matchRepository.findOne({
        where: { id: matchId },
      });

      if (match) {
        match.winner_id = winner.author_id;
        match.game_type = 'cardGame';
        match.match_over = true;
        await this.matchRepository.save(match);
      }
    }
  }
  
}

export const cardGameService = new CardGameService();