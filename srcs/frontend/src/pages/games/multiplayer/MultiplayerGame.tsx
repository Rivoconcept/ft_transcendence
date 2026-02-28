import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MultiplayerGame(): React.JSX.Element {
  const { gameSlug, roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mt-5 text-center">
      <h2>Multiplayer Game</h2>

      <p>Game: {gameSlug}</p>
      <p>Room: {roomId}</p>

      <div className="mt-4">
        <button
          className="btn btn-warning"
          onClick={() => navigate(`/games/${gameSlug}/multiplayer/lobby/${roomId}`)}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}