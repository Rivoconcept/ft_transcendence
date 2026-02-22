import { useEffect, useRef, useState } from "react";
import apiService from "../../services/api.service";

interface CardGameDbProps {
  finalScore: number;
  isWin: boolean;
  mode?: "SINGLE" | "MULTI";
  matchId?: string | null;
  isGameOver: boolean;
}

export default function CardGameDb({
  finalScore,
  isWin,
  mode = "SINGLE",
  matchId = null,
  isGameOver
}: CardGameDbProps) {
  const [status, setStatus] = useState<string | null>(null);
  const hasPushedRef = useRef(false);

  useEffect(() => {
    if (!isGameOver || hasPushedRef.current) return;

    const save = async () => {
      try {
        hasPushedRef.current = true; // ✅ immédiat
        setStatus("saving");
        await apiService.post("card-games", {
          mode,
          final_score: finalScore,
          is_win: isWin,
          match_id: matchId,
        });
        setStatus("saved");
      } catch (err) {
        setStatus("error");
      }
    };

    void save();
  }, [isGameOver, finalScore, isWin, mode, matchId]);

  if (!status) return null;

  return (
    <div className="card-game-db">
      {status === "saving" && <span>Saving...</span>}
      {status === "saved" && <span>Saved</span>}
      {status === "error" && <span>Error saving</span>}
    </div>
  );
}