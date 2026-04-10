import { useState, useEffect } from "react";
import { useCardGameState } from "../context/CardGameContext";
import { useAtomValue, useSetAtom } from "jotai";
import { gameModeAtom, playerScoresAtom } from "../cardAtoms/gameMode.atom";
import { useParams } from "react-router-dom";
import { socketStore } from "../../../../websocket";

export default function PlayerList() {
  const { players } = useCardGameState();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const mode = useAtomValue(gameModeAtom);
  const scores = useAtomValue(playerScoresAtom) as Record<number, number[]>;
  const setScores = useSetAtom(playerScoresAtom);

  const { roomId } = useParams();

  /* ================= RESET GAME ================= */
  useEffect(() => {
    setScores({});
    setSelectedPlayerId(null);
  }, [players.length]);

  /* ================= REMOVE DISCONNECTED PLAYER ================= */
  useEffect(() => {
    if (selectedPlayerId === null) return;

    const exists = players.some(p => p.id === selectedPlayerId);
    if (!exists) setSelectedPlayerId(null);
  }, [players, selectedPlayerId]);

  /* ================= SOCKET LISTEN ================= */
  useEffect(() => {
    if (!socketStore) return;

    const handleSelectPlayer = (data: { playerId: number | null }) => {
      setSelectedPlayerId(data.playerId);
    };

    socketStore.on("match:player-selected", handleSelectPlayer);

    return () => {
      socketStore.off("match:player-selected", handleSelectPlayer);
    };
  }, []);

  if (mode !== "MULTI") return null;

  useEffect(() => {
    const handleScoreUpdate = ({
      playerId,
      score,
    }: {
      playerId: number;
      score: number;
    }) => {
      setScores(prev => ({
        ...prev,
        [playerId]: [...(prev[playerId] || []), score],
      }));
    };

    socketStore.on("match:score-updated", handleScoreUpdate);

    return () => {
      socketStore.off("match:score-updated", handleScoreUpdate);
    };
  }, [setScores]);


  /* ================= CLICK ================= */
  const handleClickPlayer = (playerId: number) => {
    const newSelected = selectedPlayerId === playerId ? null : playerId;

    // local update
    setSelectedPlayerId(newSelected);

    // 🔥 broadcast aux autres joueurs
    socketStore.emit("match:select-player", {
      matchId: roomId,
      playerId: newSelected,
    });
  };

  const selectedScores =
    selectedPlayerId !== null ? scores[selectedPlayerId] || [] : [];

  return (
    <div className="dashboard">
      <div className="card bg-dark text-light shadow-sm h-100">

        <div className="card-header text-center fw-bold">
          👥 Players ({players.length})
        </div>

        {/* PLAYER LIST */}
        <ul className="list-group list-group-flush">
          {players.map(p => (
            <li
              key={p.id}
              className={`list-group-item ${
                selectedPlayerId === p.id ? "active" : ""
              }`}
              onClick={() => handleClickPlayer(p.id)}
              style={{ cursor: "pointer" }}
            >
              {p.name} <span className="badge bg-success">●</span>
            </li>
          ))}
        </ul>

        {/* SCORES */}
        {selectedPlayerId !== null && (
          <div className="card-body border-top">

            <h6 className="text-center mb-3">
              Scores
            </h6>

            {selectedScores.length === 0 ? (
              <p className="text-center text-muted">
                No scores yet
              </p>
            ) : (
              <ul className="list-group">
                {selectedScores.map((s, idx) => (
                  <li
                    key={idx}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <span>Round {idx + 1}</span>
                    <strong>{s}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  );
}