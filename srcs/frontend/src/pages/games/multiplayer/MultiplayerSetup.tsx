// src/pages/games/multiplayer/MultiplayerSetup.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { currentUserAtom } from "../../../providers/user.provider";
import { playerNameAtom } from "./matchAtoms";
import { apiService } from "../../../services";

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  const currentUser = useAtomValue(currentUserAtom);
  const setPlayerName = useSetAtom(playerNameAtom);

  const [isCreateRoom, setIsCreateRoom] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const gameMap: Record<string, number> = {
    "dice-game": 1,
    "king-of-diamond": 2,
    "card-game": 3,
  };
  const getGameId = (slug: string | undefined) => gameMap[slug ?? ""] ?? 1;

  if (!currentUser) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          Vous devez être connecté pour jouer en multiplayer.
        </div>
      </div>
    );
  }

  const playerName = currentUser.username;
  const token = apiService.getToken();

  // ── Create ──────────────────────────────────────────────────────────────────
  // Creating a match auto-joins the creator — no extra /join needed.
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!token) throw new Error("Token manquant");

      const res = await fetch(`${BACKEND_URL}/api/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_private: false, set: 1, game_id: getGameId(gameSlug) }),
      });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setPlayerName(playerName);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Erreur création salle");
    } finally {
      setLoading(false);
    }
  };

  // ── Join ────────────────────────────────────────────────────────────────────
  // IMPORTANT: must call POST /join to create the Participation row in DB.
  // Without this the player has no score record and won't appear in the game.
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!token) throw new Error("Token manquant");

      // Step 1 — create Participation row
      const joinRes = await fetch(`${BACKEND_URL}/api/matches/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!joinRes.ok) {
        const body = await joinRes.json().catch(() => ({}));
        const msg: string = body?.error ?? "";
        if (msg !== "You are already in this match") throw new Error(msg || "Impossible de rejoindre");
      }

      // Step 2 — fetch match for its id
      const matchRes = await fetch(`${BACKEND_URL}/api/matches/${roomCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!matchRes.ok) throw new Error(await matchRes.text());

      const data = await matchRes.json();
      setPlayerName(playerName);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Erreur rejoindre salle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">Multiplayer Setup : {gameSlug}</h2>

        <div className="alert alert-info text-center">
          Connecté en tant que <strong>{playerName}</strong>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <button
            className={`btn me-2 ${isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(true)}
          >Créer Salle</button>
          <button
            className={`btn ${!isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(false)}
          >Rejoindre Salle</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {isCreateRoom && (
          <form onSubmit={handleCreateRoom}>
            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Création..." : "Créer Salle"}
            </button>
          </form>
        )}

        {!isCreateRoom && (
          <form onSubmit={handleJoinRoom}>
            <div className="mb-3">
              <label className="form-label">Code de la Salle</label>
              <input
                className="form-control"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
              />
            </div>
            <button className="btn btn-success w-100" disabled={loading}>
              {loading ? "Connexion..." : "Rejoindre Salle"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
