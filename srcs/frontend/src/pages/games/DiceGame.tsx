import React, { useState } from 'react';

interface GameProps {
	onBack: () => void;
}

export default function DiceGame({ onBack }: GameProps): React.JSX.Element {
	const [dice, setDice] = useState<number[]>([1, 1, 1]);
	const [isRolling, setIsRolling] = useState<boolean>(false);
	const [showResult, setShowResult] = useState<boolean>(false);

	const rollDice = (): void => {
		setIsRolling(true);
		setShowResult(false);

		setTimeout(() => {
			const newDice: number[] = [
				Math.floor(Math.random() * 6) + 1,
				Math.floor(Math.random() * 6) + 1,
				Math.floor(Math.random() * 6) + 1
			];
			setDice(newDice);
			setIsRolling(false);
			setShowResult(true);
		}, 500);
	};

	const total: number = dice.reduce((a, b) => a + b, 0);

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
					<h3>Total Score</h3>
					<p>{total}</p>
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
