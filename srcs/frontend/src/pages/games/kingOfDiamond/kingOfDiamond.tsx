import React, { useEffect, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { appendGameHistoryAtom, startOnlineSessionAtom } from '../../dashboard/atoms/dashboardData';

interface GameProps {
	onBack: () => void;
}

export default function kingOfDiamond({ onBack }: GameProps): React.JSX.Element {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState<boolean>(false);
	const [roundSummary, setRoundSummary] = useState<null | {
		target: number;
		picks: { name: string; value: number }[];
		winner: string;
	}>(null);
	const pushHistory = useSetAtom(appendGameHistoryAtom);
	const startSession = useSetAtom(startOnlineSessionAtom);

	useEffect(() => {
		startSession();
	}, [startSession]);

	const botNames = useMemo(() => ['NeonGhost', 'VortexKing', 'LunaEclipse'], []);

	const handleSubmit = (): void => {
		if (selectedNumber !== null) {
			const bots = botNames.map((name) => ({
				name,
				value: Math.floor(Math.random() * 101),
			}));
			const picks = [{ name: 'You', value: selectedNumber }, ...bots];
			const mean = picks.reduce((sum, p) => sum + p.value, 0) / picks.length;
			const target = mean * 0.8;
			const winnerPick = picks.reduce((best, curr) => {
				const bestDist = Math.abs(best.value - target);
				const currDist = Math.abs(curr.value - target);
				return currDist < bestDist ? curr : best;
			});

			setRoundSummary({
				target,
				picks,
				winner: winnerPick.name,
			});

			pushHistory({
				gameType: 'kingOfDiamond',
				result: winnerPick.name === 'You' ? 'win' : 'loss',
				opponents: bots.map((b) => b.name),
				isMultiplayer: false,
				meta: {
					target,
					picks,
				},
			});

			setSubmitted(true);
		}
	};

	const handlePlayAgain = (): void => {
		setSubmitted(false);
		setSelectedNumber(null);
		setRoundSummary(null);
	};

	const numbers = Array.from({ length: 101 }, (_, i) => i);

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>king Of Diamond Game</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			{!submitted ? (
				<>
					<div className="number-input-container">
						<label>Select a number between 0 and 100:</label>
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
						<h2>Round Result</h2>
						<p>You selected: <strong>{selectedNumber}</strong></p>
						{roundSummary && (
							<>
								<p>Target (mean × 0.8): <strong>{roundSummary.target.toFixed(2)}</strong></p>
								<p>Winner: <strong>{roundSummary.winner}</strong></p>
							</>
						)}
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
