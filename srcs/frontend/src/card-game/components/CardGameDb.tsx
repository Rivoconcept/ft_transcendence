import { useEffect, useState } from "react";
import apiService from "../../services/api.service";

interface CardGameDbProps {
  finalScore: number;
  isWin: boolean;
  mode?: "SINGLE" | "MULTI";
  matchId?: string | null;
}

export default function CardGameDb({ finalScore, isWin, mode = "SINGLE", matchId = null }: CardGameDbProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to save when finalScore changes
    const save = async () => {
      try {
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

    // Only save when there is a meaningful final score
    if (finalScore !== null && finalScore !== undefined) {
      void save();
    }
  }, [finalScore, isWin, mode, matchId]);

  if (!status) return null;

  return (
    <div className="card-game-db">
      {status === "saving" && <span>Saving...</span>}
      {status === "saved" && <span>Saved</span>}
      {status === "error" && <span>Error saving</span>}
    </div>
  );
}
