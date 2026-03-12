// /home/rivoinfo/Videos/ft_transcendence/srcs/frontend/src/pages/games/lobby/Lobby.tsx

import React, { useState } from 'react';
import './Lobby.css';

interface Player {
	id: string;
	name: string;
	ready: boolean;
}

function Lobby() {
	const [players, setPlayers] = useState<Player[]>([
		{ id: '1', name: 'Player 1', ready: false },
		{ id: '2', name: 'Player 2', ready: false },
		{ id: '3', name: 'Player 3', ready: false },
	]);

	const [hostId] = useState<string>('1'); // assuming player 1 is the host
	const [gameStarted, setGameStarted] = useState<boolean>(false);


	const allPlayersReady = players.every(player => player.ready);

	const startGame = () => {
		if (allPlayersReady) {
			setGameStarted(true);
		} else {
			alert('All players must be ready to start the game.');
		}
	};

	return (
		<div className="lobby-container">
			<div className="header">
				<h1>Game Lobby</h1>
				<p>Waiting for players to get ready!</p>
			</div>

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

			<div className="controls">
				{hostId === '1' && !gameStarted && (
					<button
						onClick={startGame}
						className="start-game-btn"
						disabled={!allPlayersReady}
					>
						Start Game
					</button>
				)}
			</div>

			{gameStarted && (
				<div className="game-started">
					<h3>The game has started!</h3>
				</div>
			)}
		</div>
	);
};

export default Lobby;