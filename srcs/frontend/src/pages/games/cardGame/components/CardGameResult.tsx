// CardGameResult.tsx
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { FinalScore, PlayerState } from "../cardAtoms/cardAtoms";

export default function CardGameResult() {
  const finalScore = useAtomValue(FinalScore);
  const playerState = useAtomValue(PlayerState);
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate("/games");
  };

  const isWin = !!playerState;

  return (
      <div className="game-list">
            <div className="game-card">
              <h3>Game Result</h3>
              <p>
                Score: <strong>{finalScore}</strong>
              </p>
              <p>{isWin ? "✅ You Win!" : "❌ You Lose!"}</p>

              {/* 💡 Ne plus push ici, déjà fait dans CardGameDashboard */}
              {/* <CardGameDb ... /> */}

              <button className="btn btn-primary mt-3" onClick={handleBackHome}>
                Retour à l'accueil
              </button>
            </div>
      </div>
  );
}