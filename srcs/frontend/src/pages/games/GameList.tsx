import React from 'react';
import { useNavigate } from 'react-router-dom';

type GameId = 'kingOfDiamond' | 'cardGame';

export interface Game {
  id: GameId;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function GameList() {
  const navigate = useNavigate();

  const games: Game[] = [
    {
      id: 'kingOfDiamond',
      name: 'King Of Diamond',
      description: 'Pick a number between 1 and 100. Choose wisely!',
      icon: '#️⃣',
    },
    {
      id: 'cardGame',
      name: 'Card Game',
      description: 'Single or Multiplayer card challenge',
      icon: '🃏',
    },
  ];

  return (
    <div className="game-list">
      {games.map(game => (
        <div key={game.id} className="game-card">
          <div className="game-icon">{game.icon}</div>
          <h3>{game.name}</h3>
          <p>{game.description}</p>

          <div className="gameCardButton">
            <button
              className="btn-primary"
              onClick={() => navigate(`/games/${game.id}/setup`)}
            >
              ▶️ Play
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}