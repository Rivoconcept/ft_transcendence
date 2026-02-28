import React from 'react';
import { useAtom } from 'jotai';
import { gameModeAtom } from './cardGame/cardAtoms/gameMode.atom';
import { useNavigate } from 'react-router-dom';

type GameId = 'diceGame' | 'kingOfDiamond' | 'cardGame';

interface Game {
  id: GameId;
  name: string;
  description: string;
  icon: React.ReactNode;
  slug: string;
}

export default function GameList() {
  const [mode, setMode] = useAtom(gameModeAtom);
  const navigate = useNavigate();

  const games: Game[] = [
    {
      id: 'diceGame',
      name: 'Dice Game',
      description: 'Roll three dice and test your luck! Get the highest score possible.',
      icon: '🎲',
      slug: 'roll-dice',
    },
    {
      id: 'kingOfDiamond',
      name: 'King Of Diamond',
      description: 'Pick a number between 1 and 100. Choose wisely!',
      icon: '#️⃣',
      slug: 'king-of-diamond',
    },
    {
      id: 'cardGame',
      name: 'Card Game',
      description: 'Single or Multiplayer card challenge',
      icon: '🃏',
      slug: 'card-game',
    },
  ];

  const handlePlay = (game: Game) => {
    // Si Card Game et mode non sélectionné
    if (game.id === 'cardGame' && !mode) {
      alert('Please select a game mode first!');
      return;
    }

    // 🎯 CARD GAME
    if (game.id === 'cardGame') {
      if (mode === 'SINGLE') {
        navigate(`/games/${game.slug}/single`);
      } else {
        navigate(`/games/${game.slug}/multiplayer/setup`);
      }
      return;
    }

    // 🎯 AUTRES JEUX (par défaut solo pour l’instant)
    navigate(`/games/${game.slug}/single`);
  };

  return (
    <div className="game-list">
      {games.map(game => (
        <div key={game.id} className="game-card">
          <div className="game-icon">{game.icon}</div>
          <h3>{game.name}</h3>
          <p>{game.description}</p>

          {/* Mode selection uniquement pour Card Game */}
          {game.id === 'cardGame' && (
            <div className="btn-group btn-group-toggle mb-2">
              <button
                type="button"
                className={`btn btn-outline-primary ${mode === 'SINGLE' ? 'active' : ''}`}
                onClick={() => setMode('SINGLE')}
              >
                🧍 Single Player
              </button>

              <button
                type="button"
                className={`btn btn-outline-primary ${mode === 'MULTI' ? 'active' : ''}`}
                onClick={() => setMode('MULTI')}
              >
                👥 Multiplayer
              </button>
            </div>
          )}

          {/* Bouton Play unique */}
          <div className="gameCardButton">
            <button
              className="btn-primary"
              onClick={() => handlePlay(game)}
            >
              ▶️ Play
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}