import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';






export default function GameSetup(): React.JSX.Element {
  const navigate = useNavigate();
  const { gameSlug } = useParams();

  return (
    <>
      <p>... description du jeux ...</p>
      <div className="btn-group btn-group-toggle mb-2">
        <button onClick={() => navigate(`/games/${gameSlug}/multiplayer/setup`)}>👥 Multiplayer</button>
        <button onClick={() => navigate(`/games/${gameSlug}/single`)}>🧍 Single Player</button>
      </div>
    </>
  );
}