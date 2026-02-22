// /home/hrv/Pictures/ft_transcendence/srcs/backend/src/services/card-game.service.ts

import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";

interface CreateCardGameDTO {
  mode?: CardGameMode;
  final_score?: number;
  is_win?: boolean;
  match_id?: string | null;
}

class CardGameService {
  private repo = AppDataSource.getRepository(CardGame);

  async createCardGame(userId: number, data?: CreateCardGameDTO) {
    // ✅ Utilisation du CardGameMode pour le default + cast Partial<CardGame>
    const card = this.repo.create({
      author_id: userId,
      mode: data?.mode ?? CardGameMode.SINGLE, // CardGameMode au lieu de string
      final_score: data?.final_score ?? 0,
      is_win: data?.is_win ?? false,
      match_id: data?.match_id ?? null,
    } as Partial<CardGame>);

    await this.repo.save(card);
    return card;
  }

  async getByUser(userId: number) {
    return this.repo.find({
      where: { author_id: userId },
      order: { created_at: "DESC" },
    });
  }
}

export const cardGameService = new CardGameService();