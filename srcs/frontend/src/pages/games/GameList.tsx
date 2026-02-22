import React from 'react';
import { useAtom } from 'jotai';
import { gameModeAtom } from '../../card-game/cardAtoms/gameMode.atom';

type GameId = 'diceGame' | 'numberGame' | 'cardGame';

interface GameListProps {
	onStartGame: (gameId: GameId) => void;
}

interface Game {
	id: GameId;
	name: string;
	description: string;
	icon: React.ReactNode;
}

export default function GameList({ onStartGame }: GameListProps): React.JSX.Element {
	const [mode, setMode] = useAtom(gameModeAtom);

	const games: Game[] = [
		{
			id: 'diceGame',
			name: 'Dice Game',
			description: 'Roll three dice and test your luck! Get the highest score possible.',
			icon: '🎲',
		},
		{
			id: 'numberGame',
			name: 'Number Selection',
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

					{/* Only show mode selection for Card Game */}
          {game.id === 'cardGame' && (
            <div className="btn-group btn-group-toggle mb-2" data-toggle="buttons">
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

					<button
						className="btn-primary"
						onClick={() => {
							if (game.id === 'cardGame' && !mode) {
								alert('Please select a game mode first!');
								return;
							}
							onStartGame(game.id);
						}}
					>
						Play Now
					</button>
				</div>
			))}
		</div>
	);
}