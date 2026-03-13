import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { playerNameAtom } from "./matchAtoms";

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  const setPlayerName = useSetAtom(playerNameAtom);

  const [isCreateRoom, setIsCreateRoom] = useState<boolean>(true);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [roomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const USERNAME = import.meta.env.VITE_USERNAME;
  const PASSWORD = import.meta.env.VITE_PASSWORD;

  const gameMap: Record<string, number> = {
    "dice-game": 1,
    "king-of-diamond": 2,
    "card-game": 3,
  };

  const getGameId = (slug: string | undefined): number => gameMap[slug || ""] || 1;

  const getValidToken = async (): Promise<string> => {
    let token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) return token;
        localStorage.removeItem("token");
      } catch {
        localStorage.removeItem("token");
      }
    }

    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (!loginRes.ok) throw new Error("Login automatique échoué");

    const loginData = await loginRes.json();
    token = loginData.tokens?.accessToken;
    if (!token) throw new Error("Impossible de récupérer le token");

    localStorage.setItem("token", token);
    localStorage.setItem("userId", String(loginData.user.id)); // stock userId
    return token;
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerNameInput.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getValidToken();
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
          name: roomName || "Salle par défaut",
          player_name: playerNameInput, // nom du créateur
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur création salle: ${text}`);
      }

      const data = await response.json();
      setPlayerName(playerNameInput);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error("Erreur création salle:", err);
      setError(err.message || "Erreur lors de la création de la salle");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerNameInput.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getValidToken();

      const response = await fetch(`${BACKEND_URL}/api/matches/${roomCode}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur récupération salle: ${text}`);
      }

      const data = await response.json();
      setPlayerName(playerNameInput);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error("Erreur récupération salle:", err);
      setError(err.message || "Erreur lors de la récupération de la salle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="text-center mb-4">Multiplayer Setup: {gameSlug}</h2>

        <div className="d-flex justify-content-center mb-4">
          <button
            className={`btn me-2 ${isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(true)}
          >
            Créer Salle
          </button>
          <button
            className={`btn ${!isCreateRoom ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setIsCreateRoom(false)}
          >
            Rejoindre Salle
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label">Votre nom</label>
          <input
            className="form-control"
            value={playerNameInput}
            onChange={(e) => setPlayerNameInput(e.target.value)}
            placeholder="Ex : Rivo"
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {isCreateRoom && (
          <form onSubmit={handleCreateRoom}>
            <button className="btn btn-success w-100" type="submit" disabled={loading}>
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