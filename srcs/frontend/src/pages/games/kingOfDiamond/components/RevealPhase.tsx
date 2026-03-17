import { useAtomValue } from "jotai";
import { Trophy, Target, Hash } from "lucide-react";
import { currentUserAtom } from "../../../../providers";
import {
  kodLastResultAtom,
  kodPlayersAtom,
  kodRoundWinnerAtom,
} from "../../../../providers";

export function RevealPhase() {
  const currentUser = useAtomValue(currentUserAtom);
  const result = useAtomValue(kodLastResultAtom);
  const players = useAtomValue(kodPlayersAtom);
  const roundWinner = useAtomValue(kodRoundWinnerAtom);

  if (!result) return null;

  const playerName = (userId: number) =>
    players.find((p) => p.userId === userId)?.username ?? `Joueur ${userId}`;

  return (
    <div className="card">
      <div className="card-header fw-semibold d-flex align-items-center gap-2">
        <Trophy size={15} className="text-warning" />
        Résultat — Manche {result.roundNumber}
      </div>

      <div className="card-body">

        {/* Stats row */}
        <div className="row text-center g-2 mb-3">
          <div className="col-6">
            <div className="border rounded p-2">
              <div className="d-flex align-items-center justify-content-center gap-1 text-muted small mb-1">
                <Hash size={12} /> Moyenne
              </div>
              <div className="fs-4 fw-bold">{result.average.toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="border border-danger rounded p-2">
              <div className="d-flex align-items-center justify-content-center gap-1 text-danger small mb-1">
                <Target size={12} /> Cible (×0.8)
              </div>
              <div className="fs-4 fw-bold text-danger">{result.target.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Winner banner */}
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3">
          <Trophy size={16} />
          <span>
            <strong>{roundWinner?.username ?? playerName(result.winnerId)}</strong>
            {result.winnerId === currentUser?.id ? " (vous)" : ""} remporte la manche !
          </span>
        </div>

        {/* Choices chips */}
        <div className="d-flex flex-wrap gap-2">
          {result.choices.map((c) => {
            const isWinner = c.userId === result.winnerId;
            const isMe = c.userId === currentUser?.id;
            const diff = Math.abs(c.value - result.target);

            return (
              <div
                key={c.userId}
                className={`border rounded px-3 py-2 text-center ${isWinner ? "border-warning bg-warning bg-opacity-10" : ""
                  } ${isMe ? "border-danger" : ""}`}
                style={{ minWidth: 90 }}
              >
                <div className="fw-semibold">
                  {isMe ? "Vous" : playerName(c.userId)}
                  {isWinner && " 🏆"}
                </div>
                <div className="fs-5 fw-bold">{c.value}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  écart {diff.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted small mt-3 mb-0 text-center">
          La prochaine manche démarre automatiquement…
        </p>
      </div>
    </div>
  );
}
