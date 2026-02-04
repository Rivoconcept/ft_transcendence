import React from 'react';

interface Player {
	id: string;
	img: string;
	point: string;
	value: string;
	winner: boolean;
}

export default function StatusScreen(): React.JSX.Element {
	const Players: Player[] = [
		{
			id: 'diceGame',
			img: 'default.png',
			point: '8',
			value: '15',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '5',
			value: '34',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '9',
			value: '12',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '2',
			value: '5',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '3',
			value: '5',
			winner: Math.random() > 0.5
		}
	];

	const totalPoints = Players.map(player => player.point).reduce((a, b) => Number(a) + Number(b), 0);
	const average = totalPoints / Players.length;
	const target = average * 0.8;

	return (
		<div className="result-card">
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
			<div className="status-summary">
				<p>total points		: {totalPoints}</p>
				<p>average points	: {average}</p>
				<p>target points	: {average} x 0.8  = {target}</p>
			</div>
		</div>
	);
}
