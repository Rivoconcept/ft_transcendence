import { useState } from "react";
import { useCardGameState } from "../context/CardGameContext";
import { useAtomValue } from "jotai";
import { gameModeAtom } from "../cardAtoms/gameMode.atom";

export default function PlayerList() {
  const { players } = useCardGameState();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const mode = useAtomValue(gameModeAtom);

  if (mode !== "MULTI") return null;

  const handleClickPlayer = (playerId: number) => {
    setSelectedPlayerId(prev => (prev === playerId ? null : playerId));
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="dashboard">
      <div className="card bg-dark text-light shadow-sm h-100">
        <div className="card-header text-center fw-bold">
          👥 Players ({players.length})
        </div>

        <ul className="list-group list-group-flush">
          {players.map(p => (
            <li
              key={p.id}
              className={`list-group-item ${selectedPlayerId === p.id ? "active" : ""}`}
              onClick={() => handleClickPlayer(p.id)}
              style={{ cursor: "pointer" }}
            >
              {p.name} <span className="badge bg-success">●</span>
            </li>
          ))}
        </ul>

        {selectedPlayer && (
          <ul className="list-group mt-2">
            {selectedPlayer.scores.map((s, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between">
                Game {idx + 1}: <strong>{s}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}