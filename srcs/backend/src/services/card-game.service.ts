// /src/services/card-game.service.ts
import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";

interface CreateCardGameDTO {
  mode?: CardGameMode;
  final_score?: number;
  is_win?: boolean;
  match_id: string;         // obligatoire pour éviter FK null
  player_name: string;      // obligatoire
}

class CardGameService {
  private repo = AppDataSource.getRepository(CardGame);

  /**
   * Crée une partie de carte et stocke le nom du joueur
   */
  async createCardGame(userId: number, data: CreateCardGameDTO) {
    const card = this.repo.create({
      author_id: userId,
      mode: data.mode ?? CardGameMode.SINGLE, // valeur par défaut
      final_score: data.final_score ?? 0,
      is_win: data.is_win ?? false,
      match_id: data.match_id,   // maintenant obligatoire
      player_name: data.player_name, // nouveau champ
    } as Partial<CardGame>);

    await this.repo.save(card);
    return card;
  }

  /**
   * Récupère toutes les parties d'un utilisateur
   */
  async getByUser(userId: number) {
    return this.repo.find({
      where: { author_id: userId },
      order: { created_at: "DESC" },
    });
  }
}

export const cardGameService = new CardGameService();