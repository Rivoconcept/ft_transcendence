import React from 'react';

interface Player {
	id: string;
	img: string;
	point: string;
	value: string;
	winner: boolean;
}

export default function WinnerScreen(): React.JSX.Element {
	const Players: Player[] = [
		{
			id: 'diceGame',
			img: 'default.png',
			point: '8',
			value: '15',
			winner: true
		}
	];

	return (
		<div>
			<div className="player-list">
				{Players.map((player, index) => (
					<div key={`${player.id}-${index}`} className={`${player.winner ? 'player-card-winner' : 'player-card-loser'}`}>
						<div className="player-point">pt : {player.point}</div>
						<div>{`${player.winner ? '👑' : ''}`}</div>
						<img
							className="player-avatar"
							src={new URL(`../../images/${player.img}`, import.meta.url).href}
							alt={player.img}
						/>
						<div className="player-value">{player.value}</div>
					</div>
				))}
			</div>
		</div>
	);
}
