import { useEffect, useRef } from "react";
import apiService from "../../../../services/api.service";

interface CardGameDbProps {
  finalScore: number;
  isWin: boolean;
  mode: "SINGLE" | "MULTI";
  matchId?: string | null;
  isGameOver: boolean;
  onSaved: () => void;
}

export default function CardGameDb({
  finalScore,
  isWin,
  mode,
  matchId = null,
  isGameOver,
  onSaved,
}: CardGameDbProps) {

  const hasPushedRef = useRef(false);

  useEffect(() => {
    if (!isGameOver) return;
    if (hasPushedRef.current) return;

    const saveGame = async () => {
      try {
        hasPushedRef.current = true;

        await apiService.post("card-games", {
          mode,
          final_score: finalScore,
          is_win: isWin,
          match_id: matchId,
        });

        onSaved();

      } catch (error) {
        console.error("Error saving game:", error);
      }
    };

    void saveGame();

  }, [isGameOver]);

  return null;
}