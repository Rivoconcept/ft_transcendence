import React from 'react';

type GameId = 'diceGame' | 'numberGame';

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
	const games: Game[] = [
		{
			id: 'diceGame',
			name: 'Dice Game',
			description: 'Roll three dice and test your luck! Get the highest score possible.',
			icon: '🎲'
		},
		{
			id: 'numberGame',
			name: 'Number Selection',
			description: 'Pick a number between 1 and 100. Choose wisely!',
			icon: '#️⃣'
		}
	];

	return (
		<div className="game-list">
			{games.map(game => (
				<div key={game.id} className="game-card">
					<div className="game-icon">{game.icon}</div>
					<h3>{game.name}</h3>
					<p>{game.description}</p>
					<button className="btn-primary" onClick={() => onStartGame(game.id)}>
						Play Now
					</button>
				</div>
			))}
		</div>
	);
}
