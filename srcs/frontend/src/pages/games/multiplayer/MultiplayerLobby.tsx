import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MultiplayerLobby(): React.JSX.Element {
  const { gameSlug, roomId } = useParams();
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate(`/games/${gameSlug}/multiplayer/game/${roomId}`);
  };

  return (
    <div className="container mt-5 text-center">
      <h2>Room Lobby</h2>
      <p>Game: {gameSlug}</p>
      <p>Room ID: {roomId}</p>

      <div className="mt-4">
        <button
          className="btn btn-primary me-3"
          onClick={handleStartGame}
        >
          Start Game
        </button>

        <button
          className="btn btn-danger"
          onClick={() => navigate(`/games/${gameSlug}`)}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}