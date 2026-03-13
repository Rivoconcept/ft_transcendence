// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import apiService from "../../../../services/api.service";

interface CardGameDbProps {
  finalScore: number;
  isWin: boolean;
  mode: "SINGLE" | "MULTI";
  matchId?: string | null;
  player?: string; // juste le nom du joueur
  isGameOver: boolean;
  onSaved: () => void;
}

export default function CardGameDb({
  player,
  finalScore,
  isWin,
  mode,
  matchId = null,
  isGameOver,
  onSaved,
}: CardGameDbProps) {
  const hasPushedRef = useRef(false);

  useEffect(() => {
    if (!isGameOver || hasPushedRef.current) return;

    const saveGame = async () => {
      if (!matchId) {
        console.error("Cannot save game: matchId is missing");
        return;
      }

      try {
        hasPushedRef.current = true;

        await apiService.post("card-games", {
          mode,
          final_score: finalScore,
          is_win: isWin,
          match_id: matchId,
          player_name: player,
        });

        onSaved();
      } catch (error) {
        console.error("Error saving game:", error);
      }
    };

    void saveGame();
  }, [isGameOver, finalScore, isWin, mode, matchId, player, onSaved]);

  return null;
}