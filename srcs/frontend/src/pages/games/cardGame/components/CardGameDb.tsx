// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import apiService from "../../../../services/api.service";
import { currentUserAtom } from "../../../../providers";

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

useEffect(() => {
  if (!isGameOver || hasPushedRef.current) return;

  if (!currentUser) {
    console.error("User not ready, abort save");
    return;
  }

  if (finalScore === null || finalScore === undefined) {
    console.error("Final score not ready");
    return;
  }

  hasPushedRef.current = true;

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

      const payload = {
        mode,
        final_score: finalScore,
        is_win: mode === "MULTI" ? false : isWin,
        match_id: matchIdForPush,
        player_name: player || currentUser.username,
      };

      await apiService.post("card-games", payload);

      onSaved();
    } catch (error) {
      console.error("Error saving game:", error);
      hasPushedRef.current = false;
    }
  };

  void saveGame();
}, [isGameOver, currentUser, finalScore, matchId, player, isWin, mode, onSaved]);

  return null;
}
