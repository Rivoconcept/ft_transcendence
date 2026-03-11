// src/pages/games/cardGame/components/CardGameDb.tsx
import { useEffect, useRef } from "react";
import apiService from "../../../../services/api.service";
import type { GameMode } from "../cardAtoms/gameMode.atom";

interface PlayerData {
  id: number;
  score: number;
}

interface CardGameDbProps {
  finalScore?: number;
  isWin?: boolean;
  mode: GameMode;
  matchId?: string;
  players?: PlayerData[];
  winnerId?: number;
  isGameOver: boolean;
  onSaved?: () => void;
}

export default function CardGameDb({
  finalScore,
  isWin,
  mode,
  matchId,
  players,
  winnerId,
  isGameOver,
  onSaved,
}: CardGameDbProps) {

  const hasPushedRef = useRef(false);

  useEffect(() => {
    if (!isGameOver || hasPushedRef.current) return;

    const saveGame = async () => {
      try {
        hasPushedRef.current = true;

        // MULTIPLAYER
        if (mode === "MULTI" && players?.length) {
          await Promise.all(
            players.map(player =>
              apiService.post("card-games", {
                mode: "MULTI",
                final_score: player.score,
                is_win: player.id === winnerId,
                match_id: matchId ?? null,
              })
            )
          );
        } 
        // SINGLE PLAYER
        else if (mode === "SINGLE") {
          await apiService.post("card-games", {
            mode: "SINGLE",
            final_score: finalScore ?? 0,
            is_win: isWin ?? false,
            match_id: matchId ?? null,
          });
        }

        if (onSaved) onSaved();

      } catch (error) {
        console.error("Error saving card game:", error);
      }
    };

    void saveGame();
  }, [isGameOver, mode, players, winnerId, finalScore, isWin, matchId, onSaved]);

  return null;
}