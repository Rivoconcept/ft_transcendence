import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
  ready: boolean;
}

export default function MultiplayerLobby(): React.JSX.Element {
  const { gameSlug, roomId } = useParams();
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate(`/games/${gameSlug}/${roomId}/play`);
  };

  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', ready: false },
    { id: '2', name: 'Player 2', ready: false },
    { id: '3', name: 'Player 3', ready: false },
  ]);

  return (
    <div className="container mt-5 text-center">
      <h2>Room Lobby</h2>
      <p>Game: {gameSlug}</p>
      <p>Room ID: {roomId}</p>

      <div className="mt-4">

        <div className="player-list">
          <h2>Players</h2>
          <ul>
            {players.map(player => (
              <li key={player.id} className={player.ready ? 'ready' : 'not-ready'}>
                <span>{player.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          className="btn btn-primary me-3"
          onClick={handleStartGame}
        >
          Start Game
        </button>

        <button
          className="btn btn-danger"
          onClick={() => navigate(`/games`)}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}