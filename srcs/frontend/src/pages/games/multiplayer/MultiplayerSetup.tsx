// /src/pages/games/multiplayer/MultiplayerSetup.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MultiplayerSetup(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  const [isCreateRoom, setIsCreateRoom] = useState<boolean>(true);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const USERNAME = import.meta.env.VITE_USERNAME;
  const PASSWORD = import.meta.env.VITE_PASSWORD;

  // --- Mapping statique slug → game_id pour éviter les FK errors ---
  const gameMap: Record<string, number> = {
    "dice-game": 1,
    "king-of-diamond": 2,
    "card-game": 3,
  };

  const getGameId = (slug: string | undefined): number => {
    if (!slug) return 1;
    return gameMap[slug] || 1;
  };

  // --- Fonction pour obtenir un token valide ---
  const getValidToken = async (): Promise<string> => {
    let token = localStorage.getItem('token');

    if (token) {
      console.log('Token existant:', token);
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) return token;
        console.log('Token expiré ou invalide, suppression...');
        localStorage.removeItem('token');
      } catch {
        console.log('Erreur lors de la vérification du token, suppression...');
        localStorage.removeItem('token');
      }
    }

    console.log('Login automatique avec', USERNAME);
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login automatique échoué: ${text}`);
    }

    const loginData = await loginRes.json();
    token = loginData.tokens?.accessToken;
    if (!token) throw new Error('Impossible de récupérer le token après login automatique');

    localStorage.setItem('token', token);
    console.log('Nouveau token généré:', token);
    return token;
  };

  // --- Créer une salle via backend ---
  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getValidToken();
      const game_id = getGameId(gameSlug);

      const response = await fetch(`${BACKEND_URL}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_private: false,
          set: 1,
          game_id,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erreur lors de la création de la salle');
      }

      const data = await response.json();
      console.log('Salle créée:', data);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error('Erreur handleCreateRoom:', err);
      setError(err.message || 'Erreur lors de la création de la salle');
    } finally {
      setLoading(false);
    }
  };

  // --- Rejoindre une salle via backend ---
  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getValidToken();

      const response = await fetch(`${BACKEND_URL}/api/matches/${roomCode}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erreur lors de la récupération de la salle');
      }

      const data = await response.json();
      console.log('Salle récupérée:', data);
      navigate(`/games/${gameSlug}/multiplayer/lobby/${data.id}`);
    } catch (err: any) {
      console.error('Erreur handleJoinRoom:', err);
      setError(err.message || 'Erreur lors de la récupération de la salle');
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
            className={`btn me-2 ${isCreateRoom ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setIsCreateRoom(true)}
          >
            Créer Salle
          </button>
          <button
            className={`btn ${!isCreateRoom ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setIsCreateRoom(false)}
          >
            Rejoindre Salle
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {isCreateRoom && (
          <form onSubmit={handleCreateRoom}>
            <div className="mb-3">
              <label className="form-label">Nom de la Salle :</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Room 1"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="isOpen" defaultChecked />
              <label className="form-check-label" htmlFor="isOpen">
                Salle publique
              </label>
            </div>

            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer Salle'}
            </button>
          </form>
        )}

        {!isCreateRoom && (
          <form onSubmit={handleJoinRoom}>
            <div className="mb-3">
              <label className="form-label">Code de la Salle :</label>
              <input
                type="text"
                className="form-control"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABCD"
                required
              />
            </div>

            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Rejoindre Salle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}