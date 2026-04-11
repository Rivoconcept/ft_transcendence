// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import apiService from "../../../../services/api.service";
import { currentUserAtom } from "../../../../providers";
import { refreshGameHistoryAtom } from "../../../dashboard/providers/gameHistoryAtom";

interface CardGameDbProps {
  finalScore: number;
  isWin: boolean;
  mode: "SINGLE" | "MULTI";
  matchId?: string | null;
  player?: string; // just the player name
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
  const refreshGameHistory = useSetAtom(refreshGameHistoryAtom);

useEffect(() => {
  if (!isGameOver || hasPushedRef.current) return;

  if (!currentUser) {
    return;
  }

  if (finalScore === null || finalScore === undefined) {
    return;
  }

  hasPushedRef.current = true;

  const saveGame = async () => {
    if (mode === "MULTI" && !matchId) {
      return;
    }

    try {
      const payload = {
        final_score: finalScore,
        is_win: isWin,
        player_name: player || currentUser.username,
      };

      if (mode === "MULTI") {
        await apiService.post("card-games", {
          ...payload,
          mode,
          is_win: false,
          match_id: matchId,
        });
      } else {
        await apiService.post("card-games/single/finish", payload);
      }
      refreshGameHistory();

      onSaved();
    } catch {
      hasPushedRef.current = false;
    }
  };

  void saveGame();
}, [isGameOver, currentUser, finalScore, matchId, player, isWin, mode, onSaved, refreshGameHistory]);

  return null;
}
