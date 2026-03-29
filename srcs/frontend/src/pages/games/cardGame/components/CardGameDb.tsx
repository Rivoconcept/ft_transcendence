// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import apiService from "../../../../services/api.service";
import { currentUserAtom } from "../../../../providers";
import { appendGameHistoryAtom } from "../../../dashboard/atoms/dashboardData";

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
  const pushHistory = useSetAtom(appendGameHistoryAtom);

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

        // Only push local history for SINGLE mode
        // For MULTI, rely on the backend-determined results via finishMatch
        if (!shouldDetermineWinBackend) {
          pushHistory({
            gameType: "cardGame",
            result: isWin ? "win" : "loss",
            opponents: mode === "MULTI" ? ["Multiplayer match"] : ["Computer"],
            isMultiplayer: mode === "MULTI",
            meta: {
              matchId: matchIdForPush,
              finalScore,
            },
          });
        }

        onSaved();
      } catch (error) {
        console.error("Error saving game:", error);
      }
    };

    void saveGame();
  }, [isGameOver, finalScore, isWin, mode, matchId, player, onSaved]);

  return null;
}
