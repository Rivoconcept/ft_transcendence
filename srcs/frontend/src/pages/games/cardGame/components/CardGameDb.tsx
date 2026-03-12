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
      try {
        hasPushedRef.current = true;

        // Envoi du score avec le nom du joueur
        await apiService.post("card-games", {
          mode,
          final_score: finalScore,
          is_win: isWin,
          match_id: matchId,
          player_name: player, // <-- ici on utilise le nom
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