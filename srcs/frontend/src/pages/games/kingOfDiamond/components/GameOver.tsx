import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { Crown, RotateCcw } from "lucide-react";
import { currentUserAtom, kodLastResultAtom, kodPlayersAtom } from "../../../../providers/";

export function GameOver() {
  const navigate = useNavigate();
  const currentUser = useAtomValue(currentUserAtom);
  const players = useAtomValue(kodPlayersAtom);
  const lastResult = useAtomValue(kodLastResultAtom);

  const winnerId = lastResult?.gameWinnerId
    ?? players.reduce((best, p) => (p.points > best.points ? p : best), players[0])?.userId;

  const winner = players.find((p) => p.userId === winnerId);
  const iAmKing = winnerId === currentUser?.id;

  return (
    <div className="card text-center">
      <div className="card-body py-5">
        <Crown
          size={56}
          className="mb-3"
          style={{ color: "#ffc107" }}
          strokeWidth={1.5}
        />
        <h4 className="card-title">Roi de Carreaux !</h4>

        <p className="fs-5 mb-1">
          <strong>{winner?.username ?? `Joueur ${winnerId}`}</strong>
          {iAmKing ? " (vous)" : ""}
        </p>
        <p className="text-muted mb-4">remporte la couronne ♦</p>

        {/* Final standings */}
        <div className="list-group list-group-flush text-start mb-4 mx-auto" style={{ maxWidth: 260 }}>
          {[...players]
            .sort((a, b) => b.points - a.points)
            .map((p, i) => (
              <div key={p.userId} className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>
                  {i === 0 && <Crown size={13} className="me-1 text-warning" />}
                  {p.username ?? `Joueur ${p.userId}`}
                  {p.userId === currentUser?.id ? " (vous)" : ""}
                </span>
                <span className="badge bg-secondary">{p.points} pts</span>
              </div>
            ))}
        </div>

        <button
          className="btn btn-outline-dark d-inline-flex align-items-center gap-2"
          onClick={() => navigate("/games")}
        >
          <RotateCcw size={14} />
          Retour aux jeux
        </button>
      </div>
    </div>
  );
}
