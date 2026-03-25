import { useEffect, useState, useCallback } from 'react';
import { socketStore } from '../../../store/socketStore';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../../../providers/user.provider';
import { useParams } from "react-router-dom";

interface GameProps {
	onBack: () => void;
}

type Phase =
	| 'waiting'      // match not started yet
	| 'picking'      // choose a number
	| 'submitted'    // waiting for others
	| 'result'       // round result shown
	| 'spectating'   // eliminated
	| 'ended';       // game over

interface Player {
	userId: number;
	playerName: string;
	points: number;
	isActive: boolean;
	hasSubmitted: boolean;
}

interface RoundChoice {
	userId: number;
	playerName: string;
	value: number;
	isWinner: boolean;
	pointsLost: number;
}

interface RoundResult {
	roundNumber: number;
	average: number;
	target: number;
	targetRounded: number;
	winnerId: number;
	winnerName: string;
	isExactHit: boolean;
	choices: RoundChoice[];
	players: Player[];
	gameOver: boolean;
	gameWinnerId: number | null;
	gameWinnerName: string | null;
}

export default function KingOfDiamond({ onBack }: GameProps): React.JSX.Element {
	const { roomId } = useParams();
	const matchId = roomId || '';
	const currentUser = useAtomValue(currentUserAtom);
	const currentUserId = currentUser!.id;
	const [phase, setPhase] = useState<Phase>('waiting');
	const [players, setPlayers] = useState<Player[]>([]);
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [lastResult, setLastResult] = useState<RoundResult | null>(null);
	const [gameWinner, setGameWinner] = useState<{ id: number; name: string } | null>(null);
	const [submittedCount, setSubmittedCount] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const socket = socketStore.getSocket();
	// const me = players.find(p => p.userId === currentUserId);
	const activePlayers = players.filter(p => p.isActive);

	// ── Socket listeners ────────────────────────────────────────────────────────

	useEffect(() => {
		if (!socket) return;

		const onInitialized = ({ players: initial }: { matchId: string; players: Player[] }) => {
			console.log("");
			console.log("-- > Game initialized with players:", initial);
			console.log("");
			setPlayers(initial);
			setPhase('picking');
			setSubmittedCount(0);
		};

		const onChoiceSubmitted = () => {
			setSubmittedCount(prev => prev + 1);
		};

		const onRoundResult = ({ result }: { matchId: string; result: RoundResult }) => {
			setLastResult(result);
			setPlayers(result.players);
			setSubmittedCount(0);

			const stillMe = result.players.find(p => p.userId === currentUserId);
			if (result.gameOver)
				setPhase('ended');
			else if (!stillMe?.isActive)
				setPhase('spectating');
			else
				setPhase('result');
		};

		const onGameOver = ({ winnerId, winnerName }: { matchId: string; winnerId: number; winnerName: string }) => {
			setGameWinner({ id: winnerId, name: winnerName });
			setPhase('ended');
		};

		const onError = ({ error: msg }: { error: string }) => {
			setError(msg);
		};

		socket.on('kod:initialized', onInitialized);
		socket.on('kod:choice-submitted', onChoiceSubmitted);
		socket.on('kod:round-result', onRoundResult);
		socket.on('kod:game-over', onGameOver);
		socket.on('error', onError);

		// Each client requests their own initialization once mounted
		socket.emit('kod:init', { matchId });

		return () => {
			socket.off('kod:initialized', onInitialized);
			socket.off('kod:choice-submitted', onChoiceSubmitted);
			socket.off('kod:round-result', onRoundResult);
			socket.off('kod:game-over', onGameOver);
			socket.off('error', onError);
		};
	}, [socket, currentUserId]);

	// ── Actions ─────────────────────────────────────────────────────────────────

	const handleSubmit = useCallback(() => {
		if (selectedNumber === null) return;
		socketStore.emit('kod:submit', { matchId, value: selectedNumber });
		setPhase('submitted');
		setError(null);
	}, [matchId, selectedNumber]);

	const handleNextRound = useCallback(() => {
		setSelectedNumber(null);
		setLastResult(null);
		setPhase('picking');
	}, []);

	// ── Render ───────────────────────────────────────────────────────────────────

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>King of Diamond</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			{error && error !== "Only the match creator can start the game" && (
				<div className="error-banner">
					{error}
					<button onClick={() => setError(null)}>✕</button>
				</div>
			)}

			{/* Scoreboard — always visible */}
			{players.length > 0 && (
				<div className="scoreboard">
					{players.map(p => (
						<div
							key={p.userId}
							className={`score-entry ${!p.isActive ? 'eliminated' : ''} ${p.userId === currentUserId ? 'me' : ''}`}
						>
							<span className="score-name">{p.playerName}</span>
							<span className="score-points">{p.points}pts</span>
							{phase === 'submitted' && p.isActive && (
								<span className="score-status">
									{p.userId === currentUserId || lastResult ? '✓' : p.hasSubmitted ? '✓' : '…'}
								</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Waiting for game to start */}
			{phase === 'waiting' && (
				<div className="phase-panel">
					<p>Waiting for the host to start the game…</p>
				</div>
			)}

			{/* Number picker */}
			{phase === 'picking' && (
				<div className="phase-panel">
					{lastResult && (
						<div className="round-recap">
							Round {lastResult.roundNumber} — target was {lastResult.targetRounded}
							{lastResult.isExactHit && <span className="exact-hit"> (exact hit! −2pts)</span>}
						</div>
					)}

					<label className="picker-label">
						Pick a number between 0 and 100
					</label>

					<div className="number-grid">
						{Array.from({ length: 101 }, (_, i) => i).map(num => (
							<button
								key={num}
								className={`number-btn ${selectedNumber === num ? 'selected' : ''}`}
								onClick={() => setSelectedNumber(num)}
							>
								{num}
							</button>
						))}
					</div>

					{selectedNumber !== null && (
						<div className="selected-display">Your pick: {selectedNumber}</div>
					)}

					<button
						className="btn-primary"
						onClick={handleSubmit}
						disabled={selectedNumber === null}
					>
						Submit
					</button>
				</div>
			)}

			{/* Waiting for others */}
			{phase === 'submitted' && (
				<div className="phase-panel">
					<p>You picked <strong>{selectedNumber}</strong>. Waiting for others…</p>
					<p className="submitted-count">
						{submittedCount} / {activePlayers.length} submitted
					</p>
				</div>
			)}

			{/* Round result */}
			{phase === 'result' && lastResult && (
				<div className="phase-panel">
					<h3>Round {lastResult.roundNumber} result</h3>

					<div className="result-stats">
						<span>Average: {lastResult.average.toFixed(2)}</span>
						<span>Target (×0.8): {lastResult.target.toFixed(2)}</span>
						<span>Rounded: {lastResult.targetRounded}</span>
					</div>

					<div className="result-choices">
						{lastResult.choices.map(c => (
							<div
								key={c.userId}
								className={`choice-row ${c.isWinner ? 'winner' : ''} ${c.userId === currentUserId ? 'me' : ''}`}
							>
								<span>{c.playerName}</span>
								<span className="choice-value">{c.value}</span>
								{c.isWinner
									? <span className="badge-win">Winner</span>
									: <span className="badge-loss">−{c.pointsLost}pt</span>
								}
							</div>
						))}
					</div>

					<button className="btn-primary" onClick={handleNextRound}>
						Next round
					</button>
				</div>
			)}

			{/* Eliminated — spectator view */}
			{phase === 'spectating' && (
				<div className="phase-panel spectating">
					<p>You've been eliminated. Watching the remaining players…</p>
					{lastResult && (
						<div className="result-choices">
							{lastResult.choices.map(c => (
								<div key={c.userId} className={`choice-row ${c.isWinner ? 'winner' : ''}`}>
									<span>{c.playerName}</span>
									<span>{c.value}</span>
									{c.isWinner
										? <span className="badge-win">Winner</span>
										: <span className="badge-loss">−{c.pointsLost}pt</span>
									}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Game over */}
			{phase === 'ended' && (
				<div className="phase-panel ended">
					{gameWinner ? (
						<>
							<h3>
								{gameWinner.id === currentUserId
									? '♦ You are the King of Diamond!'
									: `♦ ${gameWinner.name} is the King of Diamond`}
							</h3>
							<div className="final-scores">
								{players
									.slice()
									.sort((a, b) => b.points - a.points)
									.map(p => (
										<div key={p.userId} className={`score-entry ${p.userId === currentUserId ? 'me' : ''}`}>
											<span>{p.playerName}</span>
											<span>{p.points}pts</span>
										</div>
									))}
							</div>
						</>
					) : (
						<h3>Game over</h3>
					)}
					<button className="back-btn" onClick={onBack}>Back to lobby</button>
				</div>
			)}
		</div>
	);
}