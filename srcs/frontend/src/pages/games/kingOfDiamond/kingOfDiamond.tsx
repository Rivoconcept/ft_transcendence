import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../../../providers';
import { socketStore } from '../../../store/socketStore';
import './kod.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface GameProps {
	onBack: () => void;
}

type Phase = 'waiting' | 'picking' | 'submitted' | 'result' | 'spectating' | 'ended';

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

interface HistoryEntry {
	roundNumber: number;
	average: number;
	target: number;
	targetRounded: number;
	winnerId: number;
	winnerName: string;
	isExactHit: boolean;
	choices: RoundChoice[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
	return name
		.split(' ')
		.map(w => w[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function avatarColor(userId: number): string {
	const colors = ['#7C3AED', '#B45309', '#0F766E', '#9D174D', '#1D4ED8', '#065F46'];
	return colors[userId % colors.length];
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface PlayerCardProps {
	player: Player;
	isMe: boolean;
	phase: Phase;
	myChoice?: number | null;
	choice?: RoundChoice;
	pointsLostAnim?: boolean;
}

function PlayerCard({ player, isMe, phase, myChoice, choice, pointsLostAnim }: PlayerCardProps) {
	const isEliminated = !player.isActive;
	const submitted = player.hasSubmitted || phase === 'result' || phase === 'spectating';
	const isWinner = choice?.isWinner;
	const revealed = phase === 'result' || phase === 'spectating';

	const cardClasses = [
		'player-card',
		isWinner ? 'player-card--winner' : '',
		isMe ? 'player-card--me' : '',
		submitted ? 'player-card--submitted' : '',
		isEliminated ? 'player-card--eliminated' : '',
	].filter(Boolean).join(' ');

	const revealClasses = [
		'player-card__reveal',
		revealed && isWinner ? 'player-card__reveal--revealed-winner' : '',
		revealed && !isWinner ? 'player-card__reveal--revealed' : '',
		!revealed && submitted ? 'player-card__reveal--submitted' : '',
	].filter(Boolean).join(' ');

	const pointsClasses = [
		'player-card__points',
		isWinner ? 'player-card__points--winner' : '',
		player.points <= 2 ? 'player-card__points--low' : '',
	].filter(Boolean).join(' ');

	const revealValClasses = [
		'player-card__reveal-val',
		isWinner ? 'player-card__reveal-val--winner' : '',
		isMe && !isWinner ? 'player-card__reveal-val--me' : '',
	].filter(Boolean).join(' ');

	return (
		<div className={cardClasses}>
			{isWinner && (
				<div className="player-card__crown">♛</div>
			)}

			{isEliminated && (
				<div className="player-card__elim-overlay">
					<div className="player-card__elim-icon">✕</div>
				</div>
			)}

			<div
				className={`player-card__avatar${isMe ? ' player-card__avatar--me' : ''}`}
				style={{ background: avatarColor(player.userId) }}
			>
				{initials(player.playerName)}
			</div>

			<div className={`player-card__name${isWinner ? ' player-card__name--winner' : ''}`}>
				{player.playerName}{isMe ? ' ✦' : ''}
			</div>

			<div className="player-card__points-wrap">
				<span className={pointsClasses}>{player.points}</span>
				<span className="player-card__pts-label">pts</span>

				{pointsLostAnim && choice && choice.pointsLost > 0 && (
					<span className="player-card__float">-{choice.pointsLost}</span>
				)}
			</div>

			<div className={revealClasses}>
				{revealed && choice ? (
					<span className={revealValClasses}>{choice.value}</span>
				) : isMe && phase === 'submitted' && myChoice !== null && myChoice !== undefined ? (
					<span className="player-card__reveal-val player-card__reveal-val--me">{myChoice}</span>
				) : submitted ? (
					<span className="player-card__check">✓</span>
				) : (
					<span className="player-card__dots">···</span>
				)}
			</div>
		</div>
	);
}

// ── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ history, onClose }: { history: HistoryEntry[]; onClose: () => void }) {
	return (
		<div className="kod-history">
			<div className="kod-history__header">
				<span className="kod-history__title">Round History</span>
				<button className="kod-btn" onClick={onClose}>close</button>
			</div>

			{history.length === 0 && (
				<p className="kod-history__empty">No rounds yet.</p>
			)}

			{[...history].reverse().map(h => (
				<div key={h.roundNumber} className="kod-history-entry">
					<div className="kod-history-entry__meta">
						<span className="kod-history-entry__round">Round {h.roundNumber}</span>
						<span className="kod-history-entry__winner">
							♛ {h.winnerName}{h.isExactHit ? ' · exact hit' : ''}
						</span>
					</div>
					<div className="kod-history-entry__choices">
						{h.choices.map(c => (
							<div
								key={c.userId}
								className={`kod-history-entry__chip${c.isWinner ? ' kod-history-entry__chip--winner' : ''}`}
							>
								<span>{c.playerName}</span>
								<span className="kod-history-entry__chip-val">{c.value}</span>
								{c.pointsLost > 0 && (
									<span className="kod-history-entry__chip-loss">-{c.pointsLost}</span>
								)}
							</div>
						))}
					</div>
					<div className="kod-history-entry__formula">
						avg {h.average.toFixed(1)} × 0.8 = {h.target.toFixed(2)} → <span>{h.targetRounded}</span>
					</div>
				</div>
			))}
		</div>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function KingOfDiamond({ onBack }: GameProps): React.JSX.Element {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();
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
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [showHistory, setShowHistory] = useState(false);
	const [animatingLoss, setAnimatingLoss] = useState(false);

	const socket = socketStore.getSocket();
	const activePlayers = players.filter(p => p.isActive);

	// ── Socket listeners ──────────────────────────────────────────────────────

	useEffect(() => {
		if (!socket || !matchId) return;

		const onInitialized = ({ players: initial }: { players: Player[] }) => {
			setPlayers(initial);
			setPhase('picking');
			setSubmittedCount(0);
		};

		const onChoiceSubmitted = () => {
			setSubmittedCount(prev => prev + 1);
		};

		const onRoundResult = ({ result }: { result: RoundResult }) => {
			setHistory(prev => [...prev, {
				roundNumber: result.roundNumber,
				average: result.average,
				target: result.target,
				targetRounded: result.targetRounded,
				winnerId: result.winnerId,
				winnerName: result.winnerName,
				isExactHit: result.isExactHit,
				choices: result.choices,
			}]);

			setLastResult(result);
			setAnimatingLoss(true);
			setTimeout(() => setAnimatingLoss(false), 1400);

			setPlayers(result.players.map(p => ({ ...p, hasSubmitted: true })));
			setSubmittedCount(0);

			const stillMe = result.players.find(p => p.userId === currentUserId);
			if (result.gameOver) setPhase('ended');
			else if (!stillMe?.isActive) setPhase('spectating');
			else setPhase('result');
		};

		const onGameOver = ({ winnerId, winnerName }: { winnerId: number; winnerName: string }) => {
			setGameWinner({ id: winnerId, name: winnerName });
			setPhase('ended');
		};

		const onError = ({ error: msg }: { error: string }) => setError(msg);

		socket.on('kod:initialized', onInitialized);
		socket.on('kod:choice-submitted', onChoiceSubmitted);
		socket.on('kod:round-result', onRoundResult);
		socket.on('kod:game-over', onGameOver);
		socket.on('error', onError);

		socket.emit('kod:init', { matchId });

		return () => {
			socket.off('kod:initialized', onInitialized);
			socket.off('kod:choice-submitted', onChoiceSubmitted);
			socket.off('kod:round-result', onRoundResult);
			socket.off('kod:game-over', onGameOver);
			socket.off('error', onError);
		};
	}, [socket, matchId, currentUserId]);

	// ── Actions ───────────────────────────────────────────────────────────────

	const handleSubmit = useCallback(() => {
		if (selectedNumber === null) return;
		socketStore.emit('kod:submit', { matchId, value: selectedNumber });
		setPhase('submitted');
		setError(null);
		setPlayers(prev => prev.map(p =>
			p.userId === currentUserId ? { ...p, hasSubmitted: true } : p
		));
		setSubmittedCount(1);
	}, [matchId, selectedNumber, currentUserId]);

	const handleNextRound = useCallback(() => {
		setSelectedNumber(null);
		setLastResult(null);
		setPhase('picking');
		setPlayers(prev => prev.map(p => ({ ...p, hasSubmitted: false })));
	}, []);

	// ── Shared player grid ────────────────────────────────────────────────────

	const renderPlayerGrid = (revealed: boolean) => {
		const displayPlayers = revealed ? players : activePlayers;
		return (
			<div className="kod-player-grid">
				{displayPlayers.map(player => {
					const choice = lastResult?.choices.find(c => c.userId === player.userId);
					return (
						<PlayerCard
							key={player.userId}
							player={player}
							isMe={player.userId === currentUserId}
							phase={phase}
							myChoice={selectedNumber}
							choice={choice}
							pointsLostAnim={animatingLoss}
						/>
					);
				})}
			</div>
		);
	};

	// ── Calculus reveal ───────────────────────────────────────────────────────

	const renderCalculus = () => {
		if (!lastResult) return null;
		const values = lastResult.choices.map(c => c.value);
		return (
			<div className="kod-calculus">
				<div className="kod-calculus__label">Calculus</div>
				<div className="kod-calculus__formula">
					<span>({values.join(' + ')})</span>
					<span>/</span>
					<span>{values.length}</span>
					<span>=</span>
					<span className="kod-calculus__avg">{lastResult.average.toFixed(2)}</span>
					<span>×</span>
					<span>0.8</span>
					<span>=</span>
					<span className="kod-calculus__target">{lastResult.targetRounded}</span>
				</div>
				{lastResult.isExactHit && (
					<div className="kod-calculus__exact">✦ Exact hit — all losers lose 2 points</div>
				)}
			</div>
		);
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="kod-container">

			{/* Header */}
			<div className="kod-header">
				<div className="kod-header__title">
					<span className="kod-header__diamond">♦</span>
					<span className="kod-header__name">King of Diamond</span>
					{lastResult && (
						<span className="kod-header__round">round {lastResult.roundNumber}</span>
					)}
				</div>
				<div className="kod-header__actions">
					{phase === 'picking' && history.length > 0 && (
						<button className="kod-btn" onClick={() => setShowHistory(true)}>
							History
						</button>
					)}
					<button className="kod-btn" onClick={onBack}>Leave</button>
				</div>
			</div>

			{/* Error banner */}
			{error && error !== 'Only the match creator can start the game' && (
				<div className="kod-error">
					<span>{error}</span>
					<button className="kod-error__close" onClick={() => setError(null)}>✕</button>
				</div>
			)}

			<div className="kod-content">

				{/* History overlay */}
				{showHistory && (
					<HistoryPanel history={history} onClose={() => setShowHistory(false)} />
				)}

				{/* ── Waiting ──────────────────────────────────────────────── */}
				{phase === 'waiting' && (
					<div className="phase-panel kod-waiting">
						<div className="kod-waiting__icon">♦</div>
						<p className="kod-waiting__text">Waiting for the game to begin…</p>
					</div>
				)}

				{/* ── Picking ──────────────────────────────────────────────── */}
				{phase === 'picking' && (
					<div className="phase-panel kod-numgrid">
						<div className="kod-numgrid__grid">
							{Array.from({ length: 101 }, (_, i) => i).map(num => (
								<button
									key={num}
									className={`num-btn${selectedNumber === num ? ' selected' : ''}`}
									onClick={() => setSelectedNumber(num)}
								>
									{num}
								</button>
							))}
						</div>

						<div className="kod-selection-display">
							{selectedNumber !== null ? (
								<div className="kod-selection-display__number">{selectedNumber}</div>
							) : (
								<div className="kod-selection-display__placeholder">— pick a number —</div>
							)}
						</div>

						<button
							className="kod-btn--primary"
							onClick={handleSubmit}
							disabled={selectedNumber === null}
						>
							Submit
						</button>
					</div>
				)}

				{/* ── Submitted ────────────────────────────────────────────── */}
				{phase === 'submitted' && (
					<div className="phase-panel kod-submitted">
						<div className="kod-submitted__label">Waiting for others</div>

						<div className="kod-submitted__dots">
							{activePlayers.map(p => (
								<div
									key={p.userId}
									className={[
										'kod-submitted__dot',
										p.hasSubmitted ? 'kod-submitted__dot--filled' : '',
										p.userId === currentUserId ? 'kod-submitted__dot--me' : '',
									].filter(Boolean).join(' ')}
								/>
							))}
							<span className="kod-submitted__count">
								{submittedCount}/{activePlayers.length}
							</span>
						</div>

						{renderPlayerGrid(false)}
					</div>
				)}

				{/* ── Result ───────────────────────────────────────────────── */}
				{phase === 'result' && lastResult && (
					<div className="phase-panel kod-result">
						<div className="kod-result__label">
							Round {lastResult.roundNumber} — reveal
						</div>
						{renderPlayerGrid(true)}
						{renderCalculus()}
						<div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
							<button className="kod-btn--gold" onClick={handleNextRound}>
								Next round →
							</button>
						</div>
					</div>
				)}

				{/* ── Spectating ───────────────────────────────────────────── */}
				{phase === 'spectating' && (
					<div className="phase-panel kod-spectating">
						<div className="kod-spectating__banner">
							You have been eliminated. Watching…
						</div>
						{renderPlayerGrid(lastResult !== null)}
						{lastResult && renderCalculus()}
					</div>
				)}

				{/* ── Ended ────────────────────────────────────────────────── */}
				{phase === 'ended' && (
					<div className="phase-panel kod-ended">
						<div className="kod-ended__crown">♛</div>

						{gameWinner ? (
							<>
								<div>
									<div className="kod-ended__title-label">King of Diamond</div>
									<div className="kod-ended__winner-name">{gameWinner.name}</div>
									{gameWinner.id === currentUserId && (
										<div className="kod-ended__you-note">That's you ✦</div>
									)}
								</div>

								<div className="kod-standings">
									{players
										.slice()
										.sort((a, b) => b.points - a.points)
										.map((p, i) => (
											<div
												key={p.userId}
												className={`kod-standings__row${i === 0 ? ' kod-standings__row--first' : ''}`}
											>
												<div className="kod-standings__left">
													<span className="kod-standings__rank">
														{i === 0 ? '♛' : `${i + 1}.`}
													</span>
													<span className="kod-standings__name">
														{p.playerName}{p.userId === currentUserId ? ' (you)' : ''}
													</span>
												</div>
												<span className="kod-standings__pts">{p.points} pts</span>
											</div>
										))}
								</div>
							</>
						) : (
							<div className="kod-ended__fallback">Game over.</div>
						)}

						<button className="kod-btn--gold" onClick={() => navigate('/games')}>
							Back to games
						</button>
					</div>
				)}
			</div>
		</div>
	);
}