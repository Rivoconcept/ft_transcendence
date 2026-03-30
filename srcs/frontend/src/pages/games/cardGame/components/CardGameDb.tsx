// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import apiService from "../../../../services/api.service";
import { currentUserAtom } from "../../../../providers";

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
  const currentUser = useAtomValue(currentUserAtom);

  useEffect(() => {
    if (!isGameOver || hasPushedRef.current) return;

    const saveGame = async () => {
    const generateShortId = () => Math.random().toString(36).substring(2, 6);
    const matchIdForPush =
      mode === "MULTI"
        ? matchId ?? ""
        : generateShortId();

      if (mode === "MULTI" && !matchIdForPush) {
        console.error("Cannot save multiplayer game: matchId is missing");
        return;
      }

      try {
        hasPushedRef.current = true;

        // For MULTI mode, let the backend determine is_win based on finishMatch
        // For SINGLE mode, use the frontend calculation
        const shouldDetermineWinBackend = mode === "MULTI";
        
        await apiService.post("card-games", {
          mode,
          final_score: finalScore,
          is_win: shouldDetermineWinBackend ? false : isWin,
          match_id: matchIdForPush,
          player_name: player || currentUser?.username || "unknown",
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
