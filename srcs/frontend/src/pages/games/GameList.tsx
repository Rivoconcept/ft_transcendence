import React from 'react';
import { useAtom } from 'jotai';
import { gameModeAtom } from './cardGame/cardAtoms/gameMode.atom';
import { useNavigate } from 'react-router-dom';

type GameId = 'diceGame' | 'kingOfDiamond' | 'cardGame';

interface GameListProps {
	onStartGame: (gameId: GameId) => void;
}

interface Game {
	id: GameId;
	name: string;
	description: string;
	icon: React.ReactNode;
}

export default function GameList({ onStartGame }: GameListProps) {
	const [mode, setMode] = useAtom(gameModeAtom);
	const navigate = useNavigate();

	const games: Game[] = [
		{
			id: 'diceGame',
			name: 'Dice Game',
			description: 'Roll three dice and test your luck! Get the highest score possible.',
			icon: '🎲',
		},
		{
			id: 'kingOfDiamond',
			name: 'king Of Diamond',
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

					<div className='gameCardButton'>
						<button
							className="btn-primary"
							onClick={() => {
								if (game.id === 'cardGame' && !mode) {
									alert('Please select a game mode first!');
									return;
								}
								// onStartGame(game.id)
								navigate('/lobby');
							}}
						>
							Create Looby
						</button>

						<button
							className="btn-primary"
							onClick={() => {
								// onStartGame(game.id)
								navigate('/lobby');
							}}
						>
							Join Looby
						</button>
					</div>
				</div>
			))}
		</div>
	);
}