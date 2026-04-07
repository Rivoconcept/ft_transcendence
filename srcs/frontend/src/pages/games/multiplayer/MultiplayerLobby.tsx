import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socketStore } from "../../../store/socketStore";
import { useAtomValue, useSetAtom } from "jotai";
import { playerNameAtom, isCreatorAtom } from "./matchAtoms";
import { currentUserAtom } from "../../../providers/user.provider";
import { apiService } from "../../../services";

interface Player {
  id: number;
  name: string;
  ready: boolean;
}
interface Participant {
  id: number;
  name: string;
}

interface MatchItem {
  id: string;
  set: number;
  current_set: number;
  authorId: number;
  gameId: number | null;
  is_open: boolean;
  is_private: boolean;
  match_over: boolean;
  created_at: Date;
  participantIds: number[];
  participants: Participant[];
}

export default function MultiplayerLobby(): React.JSX.Element {
  const { gameSlug, roomId } = useParams();
  const navigate = useNavigate();

  const playerName = useAtomValue(playerNameAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const setIsCreatorAtom = useSetAtom(isCreatorAtom);

  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [matchLoaded, setMatchLoaded] = useState(false);
  const hasJoinedRef = useRef(false);

  // Load match from DB on mount to get the real participant list and authorId
  useEffect(() => {
    if (!roomId || !currentUser) return;

    // Names will be enriched when match:player-joined fires
    apiService.get<MatchItem>(`/matches/${roomId}`).then(match => {
      setPlayers(
        match.participants.map((participant) => ({
          id: participant.id,
          name: participant.name,
          ready: false,
        }))
      );
      setIsCreator(match.authorId === currentUser.id);
      setMatchLoaded(true);
    }).catch(() => navigate(`/games/${gameSlug}/multiplayer/setup`));
  }, [roomId, currentUser]);

  // Sync isCreator to the atom so it's available in CardGameDashboard
  useEffect(() => {
    setIsCreatorAtom(isCreator);
  }, [isCreator, setIsCreatorAtom]);

  // Socket setup — only after match is confirmed to exist
  useEffect(() => {
    if (!matchLoaded || !roomId || !currentUser) return;

    const token = apiService.getToken();
    if (!token) {
      navigate(`/games/${gameSlug}/multiplayer/setup`);
      return;
    }

    // Reset hasJoinedRef when roomId changes
    hasJoinedRef.current = false;

    socketStore.connectAndAuth(token);
    const socket = socketStore.getSocket();
    if (!socket) return;

    const joinRoom = () => {
      if (hasJoinedRef.current) return;
      hasJoinedRef.current = true;
      socket.emit("joinMatchRoom", { matchId: roomId, playerName });
    };

    // match:player-joined now carries the full participant list with names
    // because the socket handler fetches all sockets in the room
    const handlePlayersUpdate = (data: { participants: Player[] }) => {
      setPlayers(data.participants);
    };
    const handlePlayerLeft = (data: { userId: number; playerName: string; participants: Player[] }) => {
      setPlayers(data.participants);
    };

    const handleStart = () => {
      navigate(`/games/${gameSlug}/${roomId}/play`);
    };

    const handleError = ({ error }: { error: string }) => {
      console.error("Socket error:", error);
    };

    if (socket.connected) joinRoom();
    socket.once("connect", joinRoom);
    socket.on("match:player-joined", handlePlayersUpdate);
    socket.on("match:player-left", handlePlayerLeft);
    socket.on("match:started", handleStart);
    socket.on("error", handleError);

    return () => {
      hasJoinedRef.current = false;
      // // Leave the match room before unmounting
      // socket.emit("leaveMatchRoom", { matchId: roomId });
      socket.off("connect", joinRoom);
      socket.off("match:player-joined", handlePlayersUpdate);
      socket.off("match:player-left", handlePlayerLeft);
      socket.off("match:started", handleStart);
      socket.off("error", handleError);
    };
  }, [matchLoaded, roomId, gameSlug, navigate, playerName, currentUser]);

  const startGame = async () => {
    const socket = socketStore.getSocket();
    if (socket && roomId) {
      socket.emit("startMatch", { matchId: roomId, gameSlug: gameSlug });
    }
  };

  const leaveRoom = async () => {
    const socket = socketStore.getSocket();
    if (socket && roomId) {
      socket.emit("leaveMatchRoom", { matchId: roomId });
    }
    try {
      await apiService.post(`/matches/${roomId}/leave`);
    } catch {
    }
    navigate(`/games/${gameSlug}/multiplayer/setup`);
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">Lobby : {roomId}</h2>
        {/* <h5>Players ({players.length})</h5> */}

        <ul className="list-group mb-4">
          {players.map(player => (
            <li
              key={player.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>
                {player.name}
                {player.id === currentUser?.id && " (you)"}
                {player.id === players.find(p => isCreator && p.id === currentUser?.id)?.id && (
                  <span className="badge bg-secondary ms-2">host</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {players.length === 0 && (
          <div className="alert alert-warning text-center">
            Waiting for players…
          </div>
        )}

        {isCreator && players.length > 1 && (
          <button className="btn btn-success w-100" onClick={startGame}>
            Start game
          </button>
        )}

        {!isCreator && (
          <div className="alert alert-info text-center">
            Waiting for the host to start…
          </div>
        )}

        {!isCreator && (
          <button
            className="btn btn-outline-danger w-100 mt-2"
            onClick={leaveRoom}
          >
            Leave Room
          </button>
        )}
      </div>
    </div>
  );
}