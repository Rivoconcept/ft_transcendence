import { AppDataSource } from "../database/data-source.js";
import { CardGame } from "../database/entities/card-game.js";

interface CreateCardGameDTO {
  mode?: string;
  final_score?: number;
  is_win?: boolean;
  match_id?: string | null;
}

class CardGameService {
  private repo = AppDataSource.getRepository(CardGame);

  async createCardGame(userId: number, data?: CreateCardGameDTO) {
    const card = this.repo.create({
      author_id: userId,
      mode: data?.mode ?? "SINGLE",
      final_score: data?.final_score ?? 0,
      is_win: data?.is_win ?? false,
      match_id: data?.match_id ?? null,
    });

    await this.repo.save(card);
    return card;
  }

  async getByUser(userId: number) {
    return this.repo.find({ where: { author_id: userId }, order: { created_at: "DESC" } });
  }
}

export const cardGameService = new CardGameService();
