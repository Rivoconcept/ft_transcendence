import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "../../../providers";
import { socketStore } from "../../../store/socketStore";
import { kodService, apiService } from "../../../services";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerState {
	userId: number;
	username?: string;
	points: number;
	isActive: boolean;
	hasSubmitted: boolean;
}

interface ChoiceReveal {
	userId: number;
	value: number;
}

interface RoundResult {
	roundNumber: number;
	average: number;
	target: number;
	winnerId: number;
	choices: ChoiceReveal[];
	players: PlayerState[];
	gameOver: boolean;
	gameWinnerId: number | null;
}

type Phase = "waiting" | "submitting" | "revealing" | "over";

// ─── Component ───────────────────────────────────────────────────────────────

export default function KingOfDiamond(): React.JSX.Element {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();
	const currentUser = useAtomValue(currentUserAtom);

	const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

	// ── Game state ──────────────────────────────────────────────────────────────
	const [phase, setPhase] = useState<Phase>("waiting");
	const [players, setPlayers] = useState<PlayerState[]>([]);
	const [roundNumber, setRoundNumber] = useState(1);
	const [submitted, setSubmitted] = useState(false);
	const [inputValue, setInputValue] = useState(50);
	const [submitCount, setSubmitCount] = useState(0);
	const [totalActive, setTotalActive] = useState(0);
	const [lastResult, setLastResult] = useState<RoundResult | null>(null);
	const [error, setError] = useState("");
	const [isHost, setIsHost] = useState(false);
	const [gameInitialised, setGameInitialised] = useState(false);

	const hasInited = useRef(false);

	// ── Init: start game (host only) ────────────────────────────────────────────
	const initGame = useCallback(async () => {
		if (!roomId || hasInited.current) return;
		hasInited.current = true;

		try {
			const res = await kodService.initGame(roomId);
			// if (!res.ok) {
			// 	const text = await res.text();
			// 	// If already initialised (e.g. page reload), that's fine
			// 	if (!text.includes("déjà commencé")) setError(text);
			// }
		} catch {
			setError("Impossible de démarrer la partie.");
		}
	}, [roomId, BACKEND_URL]);

	// ── Submit number ────────────────────────────────────────────────────────────
	const submitNumber = async () => {
		if (submitted || !roomId) return;
		setError("");

		try {
			const res = await kodService.submitNumber(roomId, inputValue);
		} catch {
			setError("Erreur réseau");
		}
	};

	// ── Reconnect: fetch state ───────────────────────────────────────────────────
	const fetchState = useCallback(async () => {
		if (!roomId) return;
		try {
			const data = await kodService.fetchState(roomId);

			if (data.match.match_over) { setPhase("over"); return; }
			if (!data.match.is_open) { setPhase("submitting"); }

			setRoundNumber(data.match.current_set);
			setIsHost(data.match.author_id === currentUser?.id);

			const participations: { user_id: number; score: number }[] = data.players;
			setPlayers(participations.map((p) => ({
				userId: p.user_id,
				points: p.score,
				isActive: p.score > 0,
				hasSubmitted: false,
			})));

			const round = data.currentRound;
			if (round && !round.is_complete) {
				const alreadyIn = round.choices?.find(
					(c: any) => c.user_id === currentUser?.id,
				);
				if (alreadyIn) setSubmitted(true);
			}
		} catch { /* silent */ }
	}, [roomId, BACKEND_URL, currentUser]);

	// ── Socket events ────────────────────────────────────────────────────────────
	useEffect(() => {
		if (!roomId || !currentUser) return;

		const token = apiService.getToken();
		if (!token) { navigate("/"); return; }

		socketStore.connectAndAuth(token);
		const socket = socketStore.getSocket();
		if (!socket) return;

		// Fetch current state in case of reconnect
		fetchState();

		// ── Game started (host triggered init) ──────────────────────────────────
		const onGameStarted = (data: { players: PlayerState[]; roundNumber: number }) => {
			setPlayers(data.players);
			setRoundNumber(data.roundNumber);
			setPhase("submitting");
			setSubmitted(false);
			setSubmitCount(0);
			setGameInitialised(true);
		};

		// ── Host received match:started from lobby → init KoD ───────────────────
		const onMatchStarted = () => {
			// Determine if this socket is the host
			fetchState().then(() => {
				if (isHost) initGame();
			});
		};

		// ── My choice was accepted ───────────────────────────────────────────────
		const onChoiceAck = () => {
			setSubmitted(true);
		};

		// ── Someone submitted (no value revealed) ───────────────────────────────
		const onPlayerSubmitted = (data: { submittedCount: number; totalActive: number }) => {
			setSubmitCount(data.submittedCount);
			setTotalActive(data.totalActive);
			setPlayers((prev) => prev.map((p, i) => ({
				...p,
				hasSubmitted: i < data.submittedCount, // approximate — server doesn't say who
			})));
		};

		// ── Round resolved — push to everyone simultaneously ────────────────────
		const onRoundResult = (result: RoundResult) => {
			setLastResult(result);
			setPlayers(result.players);
			setPhase("revealing");
			setSubmitted(false);
			setSubmitCount(0);
		};

		// ── Next round ──────────────────────────────────────────────────────────
		const onNextRound = (data: { roundNumber: number }) => {
			setRoundNumber(data.roundNumber);
			setPhase("submitting");
			setLastResult(null);
			setInputValue(50);
			setError("");
		};

		// ── Game over ───────────────────────────────────────────────────────────
		const onGameOver = (data: { gameWinnerId: number | null; players: PlayerState[] }) => {
			setPlayers(data.players);
			setPhase("over");
		};

		socket.on("kod:game-started", onGameStarted);
		socket.on("match:started", onMatchStarted);
		socket.on("kod:choice-ack", onChoiceAck);
		socket.on("kod:player-submitted", onPlayerSubmitted);
		socket.on("kod:round-result", onRoundResult);
		socket.on("kod:next-round", onNextRound);
		socket.on("kod:game-over", onGameOver);

		return () => {
			socket.off("kod:game-started", onGameStarted);
			socket.off("match:started", onMatchStarted);
			socket.off("kod:choice-ack", onChoiceAck);
			socket.off("kod:player-submitted", onPlayerSubmitted);
			socket.off("kod:round-result", onRoundResult);
			socket.off("kod:next-round", onNextRound);
			socket.off("kod:game-over", onGameOver);
		};
	}, [roomId, currentUser, navigate, fetchState, initGame, isHost]);

	// ── Trigger init once host knows they're host ────────────────────────────
	useEffect(() => {
		if (isHost && !gameInitialised) initGame();
	}, [isHost, gameInitialised, initGame]);

	// ─── Render ────────────────────────────────────────────────────────────────

	const me = players.find((p) => p.userId === currentUser?.id);

	return (
		<div className="container py-4" style={{ maxWidth: 720 }}>

			{/* Header */}
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h3 className="mb-0">
					♦ Roi de Carreaux
					<span className="ms-2 text-muted fs-6">Manche {roundNumber}</span>
				</h3>
				<span className="badge bg-secondary">{roomId}</span>
			</div>

			{error && <div className="alert alert-danger py-2">{error}</div>}

			<div className="row g-3">

				{/* ── Left: scoreboard ─────────────────────────────────────────── */}
				<div className="col-md-4">
					<div className="card h-100">
						<div className="card-header fw-semibold">Joueurs</div>
						<ul className="list-group list-group-flush">
							{players.map((p) => (
								<li
									key={p.userId}
									className={`list-group-item d-flex justify-content-between align-items-center
                    ${!p.isActive ? "text-decoration-line-through text-muted" : ""}
                    ${p.userId === currentUser?.id ? "fw-bold" : ""}
                  `}
								>
									<span>
										{p.userId === currentUser?.id ? "▶ " : ""}
										{p.username || `Joueur ${p.userId}`}
										{p.hasSubmitted && phase === "submitting" && (
											<span className="ms-1 text-success" title="A soumis">✓</span>
										)}
									</span>
									<PointsPips points={p.points} />
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* ── Right: action area ───────────────────────────────────────── */}
				<div className="col-md-8">

					{/* WAITING */}
					{phase === "waiting" && (
						<div className="card">
							<div className="card-body text-center py-5">
								<div className="spinner-border text-secondary mb-3" />
								<p className="text-muted">En attente du démarrage...</p>
							</div>
						</div>
					)}

					{/* SUBMITTING */}
					{phase === "submitting" && (
						<div className="card">
							<div className="card-header fw-semibold">
								Choisissez un nombre — Manche {roundNumber}
							</div>
							<div className="card-body">
								{me && !me.isActive ? (
									<div className="alert alert-warning text-center mb-0">
										Vous êtes éliminé. Observez la partie.
									</div>
								) : submitted ? (
									<div className="text-center py-3">
										<p className="fs-5 text-success fw-semibold">
											✓ Votre choix : <strong>{inputValue}</strong>
										</p>
										<p className="text-muted">
											{submitCount}/{totalActive} joueurs ont soumis…
										</p>
										<div className="progress mt-2">
											<div
												className="progress-bar progress-bar-striped progress-bar-animated"
												style={{ width: `${totalActive ? (submitCount / totalActive) * 100 : 0}%` }}
											/>
										</div>
									</div>
								) : (
									<>
										<div className="text-center mb-3">
											<span className="display-4 fw-bold text-danger">{inputValue}</span>
										</div>
										<input
											type="range"
											className="form-range mb-3"
											min={0} max={100}
											value={inputValue}
											onChange={(e) => setInputValue(Number(e.target.value))}
										/>
										<div className="d-flex gap-2 mb-3">
											{[0, 25, 50, 75, 100].map((v) => (
												<button
													key={v}
													className={`btn btn-sm flex-fill ${inputValue === v ? "btn-dark" : "btn-outline-secondary"}`}
													onClick={() => setInputValue(v)}
												>{v}</button>
											))}
										</div>
										<input
											type="number"
											className="form-control mb-3 text-center fs-5"
											min={0} max={100}
											value={inputValue}
											onChange={(e) => {
												const v = Math.max(0, Math.min(100, Number(e.target.value)));
												setInputValue(v);
											}}
										/>
										<button
											className="btn btn-danger w-100 fw-semibold"
											onClick={submitNumber}
										>
											Confirmer ♦
										</button>
									</>
								)}
							</div>
						</div>
					)}

					{/* REVEALING */}
					{phase === "revealing" && lastResult && (
						<div className="card">
							<div className="card-header fw-semibold">
								Résultat — Manche {lastResult.roundNumber}
							</div>
							<div className="card-body">
								<div className="row text-center mb-3">
									<div className="col">
										<div className="text-muted small">Moyenne</div>
										<div className="fs-4 fw-bold">{lastResult.average.toFixed(2)}</div>
									</div>
									<div className="col">
										<div className="text-muted small">Cible (×0.8)</div>
										<div className="fs-4 fw-bold text-danger">{lastResult.target.toFixed(2)}</div>
									</div>
								</div>

								<div className="alert alert-warning text-center">
									🏆 Gagnant de la manche :{" "}
									<strong>
										{players.find((p) => p.userId === lastResult.winnerId)?.username
											|| `Joueur ${lastResult.winnerId}`}
									</strong>
								</div>

								<div className="d-flex flex-wrap gap-2 mb-3">
									{lastResult.choices.map((c) => {
										const isWinner = c.userId === lastResult.winnerId;
										const isMe = c.userId === currentUser?.id;
										return (
											<span
												key={c.userId}
												className={`badge fs-6 ${isWinner ? "bg-warning text-dark" : "bg-secondary"}`}
											>
												{isMe ? "Vous" : `J.${c.userId}`}: {c.value}
												{isWinner ? " 🏆" : ""}
											</span>
										);
									})}
								</div>

								{/* Next round auto-triggers via socket; button for manual fallback */}
								<button
									className="btn btn-outline-secondary w-100"
									onClick={() => setPhase("submitting")}
								>
									Continuer →
								</button>
							</div>
						</div>
					)}

					{/* GAME OVER */}
					{phase === "over" && (
						<div className="card text-center">
							<div className="card-body py-5">
								<div style={{ fontSize: 64 }}>♦</div>
								<h4 className="card-title mt-2">Roi de Carreaux !</h4>
								<p className="card-text text-muted">
									{players.find((p) => p.userId === players.reduce(
										(best, p) => p.points > best.points ? p : best,
										players[0]!
									)?.userId)?.username || "—"} remporte la couronne.
								</p>
								<button
									className="btn btn-outline-dark mt-3"
									onClick={() => navigate("/games")}
								>
									Retour aux jeux
								</button>
							</div>
						</div>
					)}

				</div>
			</div>
		</div>
	);
}

// ─── Sub-component: point pips ────────────────────────────────────────────────
function PointsPips({ points }: { points: number }) {
	return (
		<span className="d-flex gap-1 align-items-center">
			{Array.from({ length: 10 }, (_, i) => (
				<span
					key={i}
					style={{
						display: "inline-block",
						width: 8, height: 8,
						borderRadius: "50%",
						background: i < points ? "#dc3545" : "#dee2e6",
						flexShrink: 0,
					}}
				/>
			))}
		</span>
	);
}
