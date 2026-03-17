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

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const gameMap: Record<string, number> = {
    "dice-game": 1,
    "king-of-diamond": 2,
    "card-game": 3,
  };

  const getGameId = (slug: string | undefined): number =>
    gameMap[slug || ""] || 1;

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

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = apiService.getToken();

      if (!token) {
        throw new Error("Token manquant. Veuillez vous reconnecter.");
      }

      console.log("TOKEN:", token);

      const game_id = getGameId(gameSlug);

      const response = await fetch(`${BACKEND_URL}/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_private: false,
          set: 1,
          game_id,
          player_name: playerName,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setPlayerName(playerName);

      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur création salle");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = apiService.getToken();

      if (!token) {
        throw new Error("Token manquant. Veuillez vous reconnecter.");
      }

      const response = await fetch(`${BACKEND_URL}/api/matches/${roomCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setPlayerName(playerName);

      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur récupération salle");
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
          Connecté en tant que <strong>{playerName}</strong>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <button
            className={`btn me-2 ${isCreateRoom ? "btn-success" : "btn-outline-success"
              }`}
            onClick={() => setIsCreateRoom(true)}
          >
            Créer Salle
          </button>

          <button
            className={`btn ${!isCreateRoom ? "btn-success" : "btn-outline-success"
              }`}
            onClick={() => setIsCreateRoom(false)}
          >
            Rejoindre Salle
          </button>
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