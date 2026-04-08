import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import apiService from "../../../../services/api.service";
import { socketStore } from "../../../../websocket";
import { isCreatorAtom } from "../../multiplayer/matchAtoms";

interface GameResult {
  player_name: string;
  final_score: number;
  is_win: boolean;
}

export default function CardGameMultiResult() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<GameResult[]>([]);
  const socket = socketStore.getSocket();
  const isCreator = useAtomValue(isCreatorAtom);

  useEffect(() => {
    const handleSocketResults = (data: any) => {
      const formatted: GameResult[] = data.map((r: any) => ({
        player_name: r.player_name ?? r.playerName,
        final_score: r.final_score ?? r.finalScore,
        is_win: r.is_win ?? r.isWin
      }));

      formatted.sort((a, b) => b.final_score - a.final_score);
      setResults(formatted);
    };

    if (socket) {
      socket.on("match:result", handleSocketResults);
    }

    return () => {
      if (socket) socket.off("match:result", handleSocketResults);
    };
  }, [socket]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!roomId) return;

      try {
        const data: GameResult[] = await apiService.get(`card-games/match/${roomId}`);
        const sorted = data.sort((a, b) => b.final_score - a.final_score);
        setResults(sorted);

        if (isCreator && socket) {
          socket.emit("match:publish");
        }
      } catch (err) {
        console.error("Error fetching results", err);
      }
    };

    if (isCreator || results.length === 0) {
      fetchResults();
    }
  }, [roomId, isCreator, socket]);

  const handleBackHome = () => navigate("/games");

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Match Result</h2>

      <table className="table table-striped table-bordered text-center">
        <thead style={{ backgroundColor: "#343a40", color: "white" }}>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Result</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={r.is_win ? "table-success fw-bold" : ""}>
              <td>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </td>
              <td>{r.player_name}</td>
              <td>{r.final_score}</td>
              <td>{r.is_win ? "🏆 Winner" : "❌ Lose"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center">
        <button className="btn btn-primary" onClick={handleBackHome}>
          Back to Games
        </button>
      </div>
    </div>
  );
}