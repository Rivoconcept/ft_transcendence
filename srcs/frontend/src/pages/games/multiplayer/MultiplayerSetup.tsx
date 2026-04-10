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
  is_limited: boolean;
  participations_limit: number;
  match_over: boolean;
  created_at: Date;
  participantIds: number[];
}

type Tab = "create" | "join" | "discover";

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  const currentUser = useAtomValue(currentUserAtom);
  const setPlayerName = useSetAtom(playerNameAtom);

  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("create");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [openMatches, setOpenMatches] = useState<string[]>([]);

  const [isPrivate, setIsPrivate] = useState(false);
  const [isLimited, setIsLimited] = useState(false);
  const [participationLimit, setParticipationLimit] = useState(2);

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
      const data = await apiService.post<MatchItem>("/matches", {
        is_private: isPrivate,
        set: 1,
        game_id: getGameId(gameSlug),
        player_name: playerName,
        is_limited: isLimited,
        participations_limit: isLimited ? participationLimit : null,
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
  const handleJoinRoom = async (matchCode: string) => {
    setLoading(true);
    setError("");
    try {
      const code = matchCode.trim().toUpperCase();
      if (code.length !== 4) {
        setError("Room code must be 4 characters");
        return;
      }
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


  // discovering open matches: GET /matches/discover?gameId=
  const handleDiscover = async () => {
    setDiscoverLoading(true);
    setError("");
    try {
      const ids = await apiService.get<string[]>(`/matches/discover?gameId=${getGameId(gameSlug)}`);
      setOpenMatches(ids);
    } catch (err: any) {
      setError(err.message || "Failed to fetch open matches");
    } finally {
      setDiscoverLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">
          Multiplayer Setup : {gameSlug}
        </h2>

        <div className="d-flex justify-content-center mb-4">
          <button
            className={`tab-btn me-2 ${tab === "create" ? "active" : ""}`}
            onClick={() => setTab("create")}
          >
            Create Room
          </button>

          <button
            className={`tab-btn me-2 ${tab === "join" ? "active" : ""}`}
            onClick={() => setTab("join")}
          >
            Join Room
          </button>

          <button
            className={`tab-btn ${tab === "discover" ? "active" : ""}`}
            onClick={() => {
              setTab("discover");
              handleDiscover();
            }}
          >
            Discover Rooms
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {tab === "create" && (
          <form onSubmit={handleCreateRoom}>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isPrivate">
                Private match
              </label>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="isLimited"
                checked={isLimited}
                onChange={(e) => setIsLimited(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isLimited">
                Limit number of participants
              </label>
            </div>

            {isLimited && (
              <div className="mb-3">
                <label className="form-label" htmlFor="participationLimit">
                  Max participants
                </label>
                <input
                  className="form-control"
                  type="number"
                  id="participationLimit"
                  min={2}
                  max={50}
                  value={participationLimit}
                  onChange={(e) =>
                    setParticipationLimit(Math.max(2, parseInt(e.target.value) || 2))
                  }
                />
              </div>
            )}
            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleJoinRoom(roomCode);
          }}>
            <div className="mb-3">
              <label className="form-label">Enter the room code :</label>
              <input
                className="form-control"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
              />
            </div>

            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Connecting..." : "Join"}
            </button>
          </form>
        )}

        {tab === "discover" && (
          <div>
            {discoverLoading && (
              <div className="text-center text-muted py-3">Loading…</div>
            )}

            {!discoverLoading && openMatches.length === 0 && (
              <div className="alert alert-warning text-center">
                No open rooms right now.
              </div>
            )}

            <ul className="list-group">
              {openMatches.map((id) => (
                <li
                  key={id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span className="fw-bold font-monospace">{id}</span>
                  <button
                    className="btn btn-sm btn-success"
                    disabled={loading}
                    onClick={() => handleJoinRoom(id)}
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>

            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleDiscover}
                disabled={discoverLoading}
              >
                {discoverLoading ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
