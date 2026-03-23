// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/cardGame/components/CardGameResultSingle.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../../../services/api.service";

interface GameResult {
  player_name: string;
  final_score: number;
  is_win: boolean;
}

export default function CardGameResultSingle() {
  const navigate = useNavigate();
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data: GameResult = await apiService.get("card-games/last");
        setResult(data);
      } catch (err) {
        console.error("Error fetching result", err);
      }
    };

    fetchResult();
  }, []);

  const handleBackHome = () => {
    navigate("/games");
  };

  if (!result) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading result...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">

      <div className="row justify-content-center">

        <div className="col-md-6">

          <div className="card shadow-lg border-0">

            <div className="card-header text-center bg-dark text-white">
              <h3 className="mb-0">🎮 Game Result</h3>
            </div>

            <div className="card-body text-center">

              <h5 className="card-title mb-4">
                Player : <strong>{result.player_name}</strong>
              </h5>

              <p className="fs-4">
                Score : <span className="fw-bold">{result.final_score}</span>
              </p>

              <div className="mt-3 mb-4">
                {result.is_win ? (
                  <span className="badge bg-success fs-5 p-3">
                    ✅ You Win!s
                  </span>
                ) : (
                  <span className="badge bg-danger fs-5 p-3">
                    ❌ You Lose!s
                  </span>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleBackHome}
              >
                ⬅ Back to Games
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}