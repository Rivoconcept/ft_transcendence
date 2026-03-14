import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";
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

  /**
   * Crée une partie
   */
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

  /**
   * Récupère les parties d'un utilisateur
   */
  async getByUser(userId: number) {
    return this.repo.find({
      where: { author_id: userId },
      order: { created_at: "DESC" },
    });
  }

  /**
   * Récupère les résultats d'un match (multiplayer)
   */
  async getMatchResults(matchId: string) {
    return this.repo.find({
      where: { match_id: matchId },
      order: { final_score: "DESC" },
      select: ["player_name", "final_score", "is_win"],
    });
  }
}

export const cardGameService = new CardGameService();