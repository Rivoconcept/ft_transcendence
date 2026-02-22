// src/pages/games/CardGameResult.tsx

import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { FinalScore, PlayerState } from "../cardAtoms/cardAtoms";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";
import CardGameDb from "./CardGameDb";


export default function CardGameResult() {
  const finalScore = useAtomValue(FinalScore);
  const playerState = useAtomValue(PlayerState);
  const mode = useAtomValue(gameModeAtom);
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate("/games"); // ou "/" selon ton choix
  };

  const isWin = !!playerState;

  return (
    <div className="card-game-result">
      <h2>Game Over</h2>
      <p>
        Score: <strong>{finalScore}</strong>
      </p>
      <p>{isWin ? "✅ You Win!" : "❌ You Lose!"}</p>

      <CardGameDb
        finalScore={finalScore}
        isWin={isWin}
        mode={mode ?? undefined}
        matchId={null}
        isGameOver={true}
      />

      <button className="btn btn-primary mt-3" onClick={handleBackHome}>
        Retour à l'accueil
      </button>
    </div>
  );
}