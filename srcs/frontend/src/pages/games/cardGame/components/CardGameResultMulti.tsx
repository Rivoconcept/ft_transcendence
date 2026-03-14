import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

    useEffect(() => {
    const fetchResults = async () => {
        try {
            const data: GameResult[] = await apiService.get(`card-games/match/${roomId}`);

            const sorted = data.sort((a, b) => b.final_score - a.final_score);

            setResults(sorted);

            if (isCreatorAtom && socket) {
                socket.emit("match:results", {
                matchId: roomId,
                results: sorted
                });
            }

        } catch (err) {
            console.error("Error fetching results", err);
        }
    };

    if (roomId) fetchResults();
    }, [roomId]);

    const handleBackHome = () => {
    navigate("/games");
    };

  return (
    <div className="container mt-5">

      <h2 className="mb-4 text-center">Match Result</h2>
        <table className="table table-striped table-bordered text-center">
        <thead style={{ backgroundColor: "#343a40", color: "white" }}>
            {/* ligne du header colorée */}
            <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Result</th>
            </tr>
        </thead>

        <tbody>
            {results
            .sort((a, b) => b.final_score - a.final_score) // tri décroissant
            .map((r, i) => {
                // le gagnant = premier élément après tri
                const isWinner = i === 0;

                return (
                <tr
                    key={i}
                    className={isWinner ? "table-success fw-bold" : ""}
                >
                    <td>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td>{r.player_name}</td>
                    <td>{r.final_score}</td>
                    <td>{isWinner ? "🏆 Winner" : "❌ Lose"}</td>
                </tr>
                );
            })}
        </tbody>
        </table>

      <div className="text-center">
        <button className="btn btn-primary" onClick={handleBackHome}>
          Retour aux jeux
        </button>
      </div>

    </div>
  );
}