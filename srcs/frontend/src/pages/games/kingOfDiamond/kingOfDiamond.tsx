// src/pages/games/kingOfDiamond/KingOfDiamond.tsx
// src/pages/games/kingOfDiamond/kodAtoms.ts
import { atom } from "jotai";

import { useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { Crown, Loader2, Eye, Swords, History, X, ChevronRight } from "lucide-react";

import { socketStore } from "../../../store/socketStore";
import { currentUserAtom } from "../../../providers/user.provider";
import { playerNameAtom } from "../multiplayer/matchAtoms";

import "./kod.css";

export type KodPhase =
	| "WAITING_START"   // in game page, waiting for host to emit kod:init
	| "SUBMITTING"      // round open, haven't submitted yet
	| "WAITING_RESULT"  // submitted, waiting for others
	| "RESULT"          // round resolved, showing result
	| "GAME_OVER";      // match finished

export interface KodPlayer {
	userId: number;
	playerName: string;
	points: number;
	isActive: boolean;
	hasSubmitted: boolean;
}

export interface KodChoiceResult {
	userId: number;
	playerName: string;
	value: number;
	isWinner: boolean;
	pointsLost: number;
}

export interface KodRoundResult {
	roundNumber: number;
	average: number;
	target: number;
	targetRounded: number;
	winnerId: number;
	winnerName: string;
	isExactHit: boolean;
	choices: KodChoiceResult[];
	players: KodPlayer[];
	gameOver: boolean;
	gameWinnerId: number | null;
	gameWinnerName: string | null;
}

export const kodPhaseAtom = atom<KodPhase>("WAITING_START");
export const kodRoundAtom = atom<number>(1);
export const kodPlayersAtom = atom<KodPlayer[]>([]);
export const kodLastResultAtom = atom<KodRoundResult | null>(null);
export const kodHistoryAtom = atom<KodRoundResult[]>([]);
export const kodMyChoiceAtom = atom<number | null>(null);
export const kodSliderAtom = atom<number>(50);



const STARTING_POINTS = 10;

// ── Small hook: history modal open state (local, no atom needed) ──────────────
import { useState } from "react";

export default function KingOfDiamond() {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();

	const currentUser = useAtomValue(currentUserAtom);
	const playerName = useAtomValue(playerNameAtom);

	const [phase, setPhase] = useAtom(kodPhaseAtom);
	const [round, setRound] = useAtom(kodRoundAtom);
	const [players, setPlayers] = useAtom(kodPlayersAtom);
	const [lastResult, setLastResult] = useAtom(kodLastResultAtom);
	const [history, setHistory] = useAtom(kodHistoryAtom);
	const [myChoice, setMyChoice] = useAtom(kodMyChoiceAtom);
	const [slider, setSlider] = useAtom(kodSliderAtom);

	const [historyOpen, setHistoryOpen] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const myId = currentUser?.id ?? 0;
	const myName = playerName || currentUser?.username || `Player ${myId}`;

	// Reset atoms on mount so stale state from a previous game doesn't bleed in
	useEffect(() => {
		setPhase("WAITING_START");
		setRound(1);
		setPlayers([]);
		setLastResult(null);
		setHistory([]);
		setMyChoice(null);
		setSlider(50);
	}, []);

	// ── Socket listeners ────────────────────────────────────────────────────────
	useEffect(() => {
		if (!roomId) return;

		// ── kod:game-started ──────────────────────────────────────────────────────
		// Fired by server when host emits kod:init.
		// Contains initial player list with STARTING_POINTS each.
		const onGameStarted = (data: {
			matchId: string;
			roundNumber: number;
			players: KodPlayer[];
		}) => {
			setRound(data.roundNumber);
			setPlayers(data.players);
			setMyChoice(null);
			setSlider(50);
			setPhase("SUBMITTING");
		};

		// ── kod:player-submitted ──────────────────────────────────────────────────
		// Fired after each submit — updates hasSubmitted flags, no values revealed.
		const onPlayerSubmitted = (data: {
			userId: number;
			submittedCount: number;
			totalActive: number;
			players: KodPlayer[];
		}) => {
			setPlayers(data.players);
		};

		// ── kod:round-result ──────────────────────────────────────────────────────
		// Fired once ALL active players submitted. Contains everything.
		const onRoundResult = (result: KodRoundResult) => {
			setLastResult(result);
			setPlayers(result.players);
			setHistory((prev) => [...prev, result]);

			if (result.gameOver) {
				setPhase("GAME_OVER");
			} else {
				setPhase("RESULT");
			}
		};

		// ── error ─────────────────────────────────────────────────────────────────
		const onError = (data: { error: string }) => {
			setSubmitError(data.error);
			setSubmitting(false);
		};

		socketStore.on("kod:game-started", onGameStarted);
		socketStore.on("kod:player-submitted", onPlayerSubmitted);
		socketStore.on("kod:round-result", onRoundResult);
		socketStore.on("error", onError);

		return () => {
			socketStore.off("kod:game-started", onGameStarted);
			socketStore.off("kod:player-submitted", onPlayerSubmitted);
			socketStore.off("kod:round-result", onRoundResult);
			socketStore.off("error", onError);
		};
	}, [roomId]);

	// ── Submit choice ────────────────────────────────────────────────────────────
	const handleSubmit = useCallback(() => {
		if (!roomId || submitting) return;
		setSubmitError(null);
		setSubmitting(true);

		socketStore.emit("kod:submit", {
			matchId: roomId,
			value: slider,
			playerName: myName,
		});

		setMyChoice(slider);
		setPhase("WAITING_RESULT");
		setSubmitting(false);
	}, [roomId, slider, myName, submitting]);

	// ── Next round ────────────────────────────────────────────────────────────────
	const handleNextRound = useCallback(() => {
		if (!lastResult) return;
		setRound(lastResult.roundNumber + 1);
		setMyChoice(null);
		setSlider(50);
		setLastResult(null);
		// Reset hasSubmitted on player list
		setPlayers((prev) => prev.map((p) => ({ ...p, hasSubmitted: false })));
		setPhase("SUBMITTING");
	}, [lastResult]);

	// ── Derived ───────────────────────────────────────────────────────────────────
	const myPlayer = players.find((p) => p.userId === myId);
	const amEliminated = myPlayer ? !myPlayer.isActive : false;
	const myPoints = myPlayer?.points ?? STARTING_POINTS;

	// History modal only accessible to the previous round winner
	const prevWinnerId = lastResult?.winnerId ?? null;
	const canSeeHistory = prevWinnerId === myId && history.length > 0;

	const activePlayers = players.filter((p) => p.isActive);
	const submittedPlayers = players.filter((p) => p.hasSubmitted);

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<>
			<div className="kod-dashboard">
				<div className="kod-panel">

					{/* ── WAITING_START ─────────────────────────────────────────────── */}
					{phase === "WAITING_START" && (
						<>
							<div className="kod-panel-icon"><Crown size={36} /></div>
							<h3 className="kod-panel-title">Roi de Carreaux</h3>
							<div className="kod-panel-icon" style={{ color: "#6b6880" }}>
								<Loader2 size={24} className="spin" />
							</div>
							<p className="kod-waiting">
								En attente du lancement par le créateur…
							</p>
							<p className="kod-hint">
								Chaque joueur commence avec {STARTING_POINTS} points.<br />
								Le dernier debout est couronné Roi de Carreaux.
							</p>

							{/* Player list already in room */}
							{players.length > 0 && (
								<div className="kod-players-list">
									{players.map((p) => (
										<PlayerRow key={p.userId} player={p} myId={myId} />
									))}
								</div>
							)}
						</>
					)}

					{/* ── SUBMITTING ────────────────────────────────────────────────── */}
					{phase === "SUBMITTING" && (
						<>
							<div className="kod-round-badge">Manche {round}</div>

							{amEliminated ? (
								<div className="kod-spectator">
									<Eye size={18} />
									<span>Vous êtes éliminé — mode spectateur</span>
								</div>
							) : (
								<>
									<p className="kod-hint">
										Choisissez un nombre entre <strong>0</strong> et <strong>100</strong>.<br />
										Le plus proche de <em>80 % de la moyenne</em> gagne.
									</p>

									<div className="kod-value-display">{slider}</div>

									<input
										type="range" min={0} max={100}
										value={slider}
										onChange={(e) => setSlider(Number(e.target.value))}
										className="kod-slider"
									/>
									<div className="kod-slider-labels">
										<span>0</span><span>50</span><span>100</span>
									</div>
									<input
										type="number" min={0} max={100}
										value={slider}
										onChange={(e) => {
											const n = Math.min(100, Math.max(0, Number(e.target.value) || 0));
											setSlider(n);
										}}
										className="kod-number-input"
									/>

									{submitError && <p className="kod-error">{submitError}</p>}

									<button
										className="kod-btn kod-btn-primary"
										onClick={handleSubmit}
										disabled={submitting}
									>
										<Swords size={16} />
										{submitting ? "Soumission…" : "Soumettre"}
									</button>
								</>
							)}

							<div className="kod-players-list">
								{players.map((p) => (
									<PlayerRow key={p.userId} player={p} myId={myId} showDot />
								))}
							</div>
						</>
					)}

					{/* ── WAITING_RESULT ────────────────────────────────────────────── */}
					{phase === "WAITING_RESULT" && (
						<>
							<div className="kod-round-badge">Manche {round}</div>
							<div className="kod-panel-icon">
								<Loader2 size={32} className="spin" />
							</div>
							<p className="kod-panel-title">Choix soumis : {myChoice}</p>
							<p className="kod-waiting">
								En attente des autres joueurs…<br />
								({submittedPlayers.length}/{activePlayers.length} ont soumis)
							</p>

							<div className="kod-progress-bar">
								<div
									className="kod-progress-fill"
									style={{
										width: activePlayers.length > 0
											? `${(submittedPlayers.length / activePlayers.length) * 100}%`
											: "0%"
									}}
								/>
							</div>

							<div className="kod-players-list">
								{players.map((p) => (
									<PlayerRow key={p.userId} player={p} myId={myId} showDot />
								))}
							</div>
						</>
					)}

					{/* ── RESULT ────────────────────────────────────────────────────── */}
					{phase === "RESULT" && lastResult && (
						<>
							<div className="kod-round-badge">Résultat — Manche {lastResult.roundNumber}</div>

							{lastResult.isExactHit && (
								<div className="kod-exact-badge">
									♦ Cible exacte — tous les perdants −2 pts ♦
								</div>
							)}

							<div className="kod-result-stats">
								<div className="kod-stat">
									<span className="kod-stat-label">Moyenne</span>
									<span className="kod-stat-value">{lastResult.average.toFixed(2)}</span>
								</div>
								<div className="kod-stat">
									<span className="kod-stat-label">Cible ×0.8</span>
									<span className="kod-stat-value gold">{lastResult.target.toFixed(2)}</span>
								</div>
								<div className="kod-stat">
									<span className="kod-stat-label">Vainqueur</span>
									<span className="kod-stat-value green">
										{lastResult.winnerId === myId ? "Vous !" : lastResult.winnerName}
									</span>
								</div>
							</div>

							<div className="kod-choices-grid">
								{lastResult.choices.map((c) => (
									<div key={c.userId} className={`kod-choice-chip${c.isWinner ? " winner" : ""}`}>
										<span className="chip-name">
											{c.userId === myId ? "Vous" : c.playerName}
										</span>
										<span className="chip-value">{c.value}</span>
										{c.isWinner
											? <Crown size={12} />
											: <span className="chip-lost">−{c.pointsLost} pt{c.pointsLost > 1 ? "s" : ""}</span>
										}
									</div>
								))}
							</div>

							<div className="kod-players-list">
								{lastResult.players.map((p) => (
									<PlayerRow key={p.userId} player={p} myId={myId} />
								))}
							</div>

							{canSeeHistory && (
								<button
									className="kod-btn kod-btn-secondary"
									onClick={() => setHistoryOpen(true)}
								>
									<History size={14} /> Historique des manches
								</button>
							)}

							<button className="kod-btn kod-btn-primary" onClick={handleNextRound}>
								<ChevronRight size={16} /> Manche suivante
							</button>
						</>
					)}

					{/* ── GAME_OVER ─────────────────────────────────────────────────── */}
					{phase === "GAME_OVER" && lastResult && (
						<>
							<div className="kod-panel-icon" style={{ color: "#d4a843" }}>
								<Crown size={48} />
							</div>
							<h3 className="kod-panel-title">
								{lastResult.gameWinnerId === myId
									? "👑 Vous êtes le Roi de Carreaux !"
									: "Partie Terminée"}
							</h3>
							{lastResult.gameWinnerId !== myId && lastResult.gameWinnerName && (
								<p className="kod-waiting">
									<strong>{lastResult.gameWinnerName}</strong> est couronné Roi de Carreaux.
								</p>
							)}

							<div className="kod-players-list" style={{ marginTop: 8 }}>
								{[...lastResult.players]
									.sort((a, b) => b.points - a.points)
									.map((p, i) => (
										<div
											key={p.userId}
											className={`kod-player-row${!p.isActive ? " eliminated" : ""}`}
										>
											<span style={{ fontSize: 16, minWidth: 24 }}>
												{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
											</span>
											<span className="kod-player-name">
												{p.playerName}
												{p.userId === myId && <em>(vous)</em>}
											</span>
											<span className="kod-player-points">{p.points} pts</span>
										</div>
									))}
							</div>

							<button
								className="kod-btn kod-btn-primary"
								onClick={() => navigate("/games")}
							>
								Retour aux jeux
							</button>
						</>
					)}

				</div>
			</div>

			{/* ── History modal ──────────────────────────────────────────────────── */}
			{historyOpen && (
				<div
					className="kod-modal-overlay"
					onClick={(e) => e.target === e.currentTarget && setHistoryOpen(false)}
				>
					<div className="kod-modal">
						<div className="kod-modal-header">
							<span>Historique des Manches</span>
							<button onClick={() => setHistoryOpen(false)}><X size={16} /></button>
						</div>
						<div className="kod-modal-body">
							{[...history].reverse().map((r) => (
								<div key={r.roundNumber} className="kod-history-round">
									<div className="kod-history-header">
										<span>Manche {r.roundNumber}</span>
										<span className="gold">
											Vainqueur : {r.winnerId === myId ? "Vous" : r.winnerName}
										</span>
									</div>
									<div className="kod-history-stats">
										<span>Moy. {r.average.toFixed(2)}</span>
										<span>Cible {r.target.toFixed(2)}</span>
									</div>
									<div className="kod-history-choices">
										{r.choices.map((c) => (
											<div
												key={c.userId}
												className={`kod-history-choice${c.isWinner ? " winner" : ""}`}
											>
												<span>{c.userId === myId ? "Vous" : c.playerName}</span>
												<strong>{c.value}</strong>
												{c.isWinner && <Crown size={10} />}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

// ── PlayerRow sub-component ───────────────────────────────────────────────────

function PlayerRow({
	player,
	myId,
	showDot = false,
}: {
	player: KodPlayer;
	myId: number;
	showDot?: boolean;
}) {
	const pct = (player.points / STARTING_POINTS) * 100;

	return (
		<div className={`kod-player-row${!player.isActive ? " eliminated" : ""}`}>
			<span className="kod-player-name">
				{player.playerName}
				{player.userId === myId && <em>(vous)</em>}
				{!player.isActive && <span className="elim-tag">éliminé</span>}
			</span>

			<div className="kod-points-bar-wrap">
				<div className="kod-points-bar">
					<div
						className={`kod-points-fill ${pct <= 20 ? "low" : pct <= 50 ? "mid" : ""}`}
						style={{ width: `${pct}%` }}
					/>
				</div>
				<span className="kod-player-points">{player.points}</span>
			</div>

			{showDot && (
				<span
					className={`kod-submitted-dot${player.hasSubmitted ? " submitted" : ""}`}
					title={player.hasSubmitted ? "A soumis" : "En attente"}
				/>
			)}
		</div>
	);
}
