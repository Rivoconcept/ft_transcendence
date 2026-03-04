import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function StatusScreen(): React.JSX.Element {
  const { gameSlug } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container text-center mt-5">
      <h2>Lobby - {gameSlug}</h2>

      <div className="mt-4">
        <button
          className="btn btn-primary me-3"
          onClick={() => navigate(`/games/${gameSlug}/multiplayer/setup`)}
        >
          Multiplayer
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/games/${gameSlug}`)}
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}