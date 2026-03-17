import { useAtomValue } from "jotai";
import { Crown, Circle } from "lucide-react";
import { currentUserAtom } from "../../../../providers";
import { kodPlayersAtom, kodPhaseAtom } from "../../../../providers";
import type { KodPlayerState } from "../../../../models";

export function Scoreboard() {
  const players = useAtomValue(kodPlayersAtom);
  const phase = useAtomValue(kodPhaseAtom);
  const currentUser = useAtomValue(currentUserAtom);

  return (
    <div className="card h-100">
      <div className="card-header d-flex align-items-center gap-2 fw-semibold">
        <Crown size={15} />
        Joueurs
      </div>
      <ul className="list-group list-group-flush">
        {players.map((p) => (
          <PlayerRow
            key={p.userId}
            player={p}
            isMe={p.userId === currentUser?.id}
            showSubmitted={phase === "submitting"}
          />
        ))}
        {players.length === 0 && (
          <li className="list-group-item text-muted text-center py-3 small">
            En attente des joueurs…
          </li>
        )}
      </ul>
    </div>
  );
}

function PlayerRow({
  player,
  isMe,
  showSubmitted,
}: {
  player: KodPlayerState;
  isMe: boolean;
  showSubmitted: boolean;
}) {
  return (
    <li
      className={[
        "list-group-item d-flex align-items-center justify-content-between gap-2 py-2",
        !player.isActive ? "text-muted" : "",
        isMe ? "bg-light fw-semibold" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="d-flex align-items-center gap-2 min-w-0">
        {isMe && (
          <span className="text-danger" style={{ fontSize: 10 }}>▶</span>
        )}
        <span
          className={`text-truncate ${!player.isActive ? "text-decoration-line-through" : ""}`}
          style={{ maxWidth: 110 }}
        >
          {player.username || `Joueur ${player.userId}`}
        </span>
        {showSubmitted && player.isActive && player.hasSubmitted && (
          <Circle size={8} fill="green" color="green" />
        )}
      </div>

      <PointPips points={player.points} />
    </li>
  );
}

function PointPips({ points }: { points: number }) {
  return (
    <div className="d-flex gap-1 flex-shrink-0">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: i < points ? "#dc3545" : "#dee2e6",
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}
