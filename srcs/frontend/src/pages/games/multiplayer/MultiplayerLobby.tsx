// src/pages/games/multiplayer/MultiplayerLobby.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socketStore } from "../../../store/socketStore";
import { useAtomValue } from "jotai";
import { playerNameAtom } from "./matchAtoms";
import { currentUserAtom } from "../../../providers/user.provider";
import { apiService } from "../../../services";

interface Player {
  id: number;
  name: string;
  ready: boolean;
}

// Converts URL slug → camelCase route segment used in your router
const SLUG_TO_ROUTE: Record<string, string> = {
  "dice-game": "diceGame",
  "king-of-diamond": "kingOfDiamond",
  "card-game": "cardGame",
};

export default function MultiplayerLobby(): React.JSX.Element {
  const { gameSlug, roomId } = useParams();
  const navigate = useNavigate();

  const playerName = useAtomValue(playerNameAtom);
  const currentUser = useAtomValue(currentUserAtom);

  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [me, setMe] = useState<Player | null>(null);

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const token = apiService.getToken();
    if (!token) {
      navigate(`/games/${gameSlug}/multiplayer/setup`);
      return;
    }

    socketStore.connectAndAuth(token);
    const socket = socketStore.getSocket();
    if (!socket) return;

    const joinRoom = () => {
      socket.emit("joinMatchRoom", { matchId: roomId, playerName });
    };

    const handlePlayers = (data: { participants?: Player[]; creatorId: number }) => {
      const participants = data.participants ?? [];
      setPlayers(participants);
      setMe(participants.find((p) => p.id === currentUser.id) ?? null);
      setIsCreator(data.creatorId === currentUser.id);
    };

    // Navigate helper — converts slug to the camelCase segment your router expects
    const navigateToGame = () => {
      const segment = SLUG_TO_ROUTE[gameSlug ?? ""] ?? gameSlug;
      navigate(`/games/${segment}/${roomId}/play`);
    };

    // For KoD: server emits "kod:game-started" (not "match:started")
    // Both are handled so other games still work
    const handleGenericStart = () => navigateToGame();
    const handleKodStart = () => navigateToGame();

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on("match:player-joined", handlePlayers);
    socket.on("match:started", handleGenericStart);
    socket.on("kod:game-started", handleKodStart);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("match:player-joined", handlePlayers);
      socket.off("match:started", handleGenericStart);
      socket.off("kod:game-started", handleKodStart);
    };
  }, [roomId, gameSlug, navigate, playerName, currentUser]);

  const startGame = () => {
    const socket = socketStore.getSocket();
    if (!socket || !roomId) return;

    if (gameSlug === "king-of-diamond") {
      // Emits kod:game-started to the room → all clients navigate
      socket.emit("kod:init", { matchId: roomId });
    } else {
      socket.emit("startMatch", { matchId: roomId });
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">Lobby : {roomId}</h2>

        <h5>Joueurs ({players.length})</h5>
        <ul className="list-group mb-4">
          {players.map((player) => (
            <li
              key={player.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {player.name} {me?.id === player.id && "(vous)"}
              {player.ready && <span className="badge bg-success">Prêt</span>}
            </li>
          ))}
        </ul>

        {players.length === 0 && (
          <div className="alert alert-warning text-center">
            En attente de joueurs...
          </div>
        )}

        {isCreator && players.length > 1 && (
          <button className="btn btn-success w-100" onClick={startGame}>
            Lancer le jeu
          </button>
        )}

        {!isCreator && players.length > 0 && (
          <div className="alert alert-info text-center">
            En attente du créateur...
          </div>
        )}
      </div>
    </div>
  );
}
