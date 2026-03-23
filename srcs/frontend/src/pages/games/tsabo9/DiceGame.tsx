import React, { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { appendGameHistoryAtom, startOnlineSessionAtom } from '../../dashboard/atoms/dashboardData';

interface GameProps {
	onBack: () => void;
}

export default function DiceGame({ onBack }: GameProps): React.JSX.Element {
	const [dice, setDice] = useState<number[]>([1, 1, 1]);
	const [isRolling, setIsRolling] = useState<boolean>(false);
	const [showResult, setShowResult] = useState<boolean>(false);
	const pushHistory = useSetAtom(appendGameHistoryAtom);
	const startSession = useSetAtom(startOnlineSessionAtom);

	useEffect(() => {
		startSession();
	}, [startSession]);

	const rollDice = (): void => {
		setIsRolling(true);
		setShowResult(false);

		setTimeout(() => {
			const newDice: number[] = [
				Math.floor(Math.random() * 9) + 1,
				Math.floor(Math.random() * 9) + 1,
				Math.floor(Math.random() * 9) + 1
			];
			setDice(newDice);
			setIsRolling(false);
			setShowResult(true);

			const totalScore = newDice.reduce((a, b) => a + b, 0);
			const mod9Score = ((totalScore % 9) + 9) % 9;
			const isWin = totalScore >= 27;

			pushHistory({
				gameType: 'diceGame',
				result: isWin ? 'win' : 'loss',
				opponents: ['Computer'],
				isMultiplayer: false,
				meta: {
					roll: newDice,
					totalScore,
					mod9Score
				}
			});
		}, 500);
	};

	const total: number = dice.reduce((a, b) => a + b, 0);
	const mod9Score: number = ((total % 9) + 9) % 9;
	const isWin = total >= 27;

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>Dice Game</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			<div className="dice-container">
				{dice.map((value, index) => (
					<div key={index} className="dice">
						{value}
					</div>
				))}
			</div>

			{showResult && (
				<div className="result-card">
					<h3>Scores</h3>
					<p>Roll Total: {total}</p>
					<p>Mod-9 Score: {mod9Score}</p>
					<p>{isWin ? 'WIN' : 'LOSS'}</p>
				</div>
			)}

			<button
				className="roll-btn"
				onClick={rollDice}
				disabled={isRolling}
			>
				{isRolling ? 'Rolling...' : 'Roll Dice'}
			</button>
		</div>
	);
}
