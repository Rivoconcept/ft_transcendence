import React, { useState } from 'react';

interface GameProps {
	onBack: () => void;
}

export default function kingOfDiamond({ onBack }: GameProps): React.JSX.Element {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState<boolean>(false);

	const handleSubmit = (): void => {
		if (selectedNumber !== null) {
			setSubmitted(true);
		}
	};

	const handlePlayAgain = (): void => {
		setSubmitted(false);
		setSelectedNumber(null);
	};

	const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>king Of Diamond Game</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			{!submitted ? (
				<>
					<div className="number-input-container">
						<label>Select a number between 1 and 100:</label>
						<div className="number-grid">
							{numbers.map((num) => (
								<button
									key={num}
									className={`number-btn ${selectedNumber === num ? 'selected' : ''}`}
									onClick={() => setSelectedNumber(num)}
								>
									{num}
								</button>
							))}
						</div>
					</div>

					{selectedNumber !== null && (
						<div className="number-display">
							{selectedNumber}
						</div>
					)}

					<button
						className="btn-primary"
						onClick={handleSubmit}
						disabled={selectedNumber === null}
					>
						Submit Number
					</button>
				</>
			)
				:
				(
					<div className="game-over-container">
						<h2>Number Submitted!</h2>
						<p>You selected: <strong>{selectedNumber}</strong></p>
						<div className="button-group">
							<button className="btn-primary" onClick={handlePlayAgain}>
								Play Again
							</button>
							<button className="back-btn" onClick={onBack}>
								Back to Games
							</button>
						</div>
					</div>
				)}
		</div>
	);
}
