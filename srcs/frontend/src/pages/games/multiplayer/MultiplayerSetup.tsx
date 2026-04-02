// src/pages/games/multiplayer/MultiplayerSetup.tsx

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";

import { currentUserAtom } from "../../../providers/user.provider";
import { playerNameAtom } from "./matchAtoms";
import { apiService } from "../../../services";

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
}

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  const currentUser = useAtomValue(currentUserAtom);
  const setPlayerName = useSetAtom(playerNameAtom);

  const [isCreateRoom, setIsCreateRoom] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gameMap: Record<string, number> = {
    "kingOfDiamond": 1,
    "cardGame": 2,
  };

  const getGameId = (slug: string | undefined): number => gameMap[slug || ""] || 1;

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          You must be logged in to play multiplayer.
        </div>
      </div>
    );
  }

  const playerName = currentUser.username;

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const game_id = getGameId(gameSlug);

      let game = (game_id == 2) ? "Kod" : "game card";

      console.log("---> Creating match for game_id:", game);

      const data = await apiService.post<MatchItem>("/matches", {
        is_private: false,
        set: 1,
        game_id,
        player_name: playerName,
      });

      setPlayerName(playerName);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  // Joining: POST /matches/:id/join, NOT GET /matches/:id
  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const code = roomCode.trim().toUpperCase();
      if (code.length !== 4) {
        setError("Room code must be 4 characters");
        return;
      }

      // 🔹 Charger le token depuis localStorage
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken) throw new Error("No access token available.");

      apiService.setTokens(accessToken, refreshToken || "");

      // 🔹 POST join room
      await apiService.post(`/matches/${code}/join`, { gameId: getGameId(gameSlug) });

      setPlayerName(playerName);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${code}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">
          Multiplayer Setup : {gameSlug}
        </h2>

        <div className="alert alert-info text-center">
          Logged in as <strong>{playerName}</strong>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <button
            className={`btn me-2 ${isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(true)}
          >
            Create Room
          </button>

          <button
            className={`btn ${!isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(false)}
          >
            Join Room
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {isCreateRoom && (
          <form onSubmit={handleCreateRoom}>
            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </button>
          </form>
        )}

        {!isCreateRoom && (
          <form onSubmit={handleJoinRoom}>
            <div className="mb-3">
              <label className="form-label">Room Code</label>
              <input
                className="form-control"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
              />
            </div>

            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Connecting..." : "Join Room"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}