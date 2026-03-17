import { atom } from "jotai";
import { useSetAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { currentUserAtom } from "./index";   // your existing atom
import { socketStore } from "../store/socketStore";   // your existing store
import { kodApiService, apiService } from "../services";

import type {
	KodPhase,
	KodGameStartedPayload,
	KodPlayerSubmittedPayload,
	KodRoundResult,
	KodNextRoundPayload,
	KodGameOverPayload,
	KodPlayerState,
} from "../models/kod.model";

interface KodProviderProps {
	matchId: string;
	children: React.ReactNode;
}

// ─── Core game atoms ──────────────────────────────────────────────────────────

/** Current UI phase */
export const kodPhaseAtom = atom<KodPhase>("waiting");

/** All players and their live point totals */
export const kodPlayersAtom = atom<KodPlayerState[]>([]);

/** Current round number */
export const kodRoundNumberAtom = atom<number>(1);

/** Whether the current user has submitted their number this round */
export const kodSubmittedAtom = atom<boolean>(false);

/** The value the current user submitted (shown in waiting screen) */
export const kodSubmittedValueAtom = atom<number | null>(null);

/** How many players have submitted / total active this round */
export const kodSubmitProgressAtom = atom<{ count: number; total: number }>({
	count: 0,
	total: 0,
});

/** Last round result — populated after resolution */
export const kodLastResultAtom = atom<KodRoundResult | null>(null);

/** Whether this user is the match host */
export const kodIsHostAtom = atom<boolean>(false);

/** Whether the game has been initialised (init endpoint called) */
export const kodInitialisedAtom = atom<boolean>(false);

/** Error message to display */
export const kodErrorAtom = atom<string>("");

// ─── Derived atoms ────────────────────────────────────────────────────────────

/** Active players (points > 0) */
export const kodActivePlayersAtom = atom(
	(get) => get(kodPlayersAtom).filter((p) => p.isActive),
);

/** The winner player from the last resolved round */
export const kodRoundWinnerAtom = atom((get) => {
	const result = get(kodLastResultAtom);
	const players = get(kodPlayersAtom);
	if (!result) return null;
	return players.find((p) => p.userId === result.winnerId) ?? null;
});

/** Overall game winner (only set when phase === "over") */
export const kodGameWinnerAtom = atom((get) => {
	const result = get(kodLastResultAtom);
	if (!result?.gameOver) return null;
	const players = get(kodPlayersAtom);
	return players.find((p) => p.userId === result.gameWinnerId) ?? null;
});

/**
 * KodProvider wires all socket events to Jotai atoms.
 * Mount this once at the page level — it owns the entire game lifecycle.
 */
export function KodProvider({ matchId, children }: KodProviderProps) {
	const navigate = useNavigate();
	const currentUser = useAtomValue(currentUserAtom);

	const setPhase = useSetAtom(kodPhaseAtom);
	const setPlayers = useSetAtom(kodPlayersAtom);
	const setRoundNumber = useSetAtom(kodRoundNumberAtom);
	const setSubmitted = useSetAtom(kodSubmittedAtom);
	const setSubmittedVal = useSetAtom(kodSubmittedValueAtom);
	const setProgress = useSetAtom(kodSubmitProgressAtom);
	const setLastResult = useSetAtom(kodLastResultAtom);
	const setIsHost = useSetAtom(kodIsHostAtom);
	const setInitialised = useSetAtom(kodInitialisedAtom);
	const setError = useSetAtom(kodErrorAtom);

	const hasInited = useRef(false);
	const isHost = useRef(false);

	// ── Fetch state on mount / reconnect ───────────────────────────────────────
	const syncState = async () => {
		apiService.loadToken(); // ← add this line
		if (!apiService.isAuthenticated()) return;
		try {
			const state = await kodApiService.getState(matchId);
			const { match, players, currentRound } = state;

			isHost.current = match.author_id === currentUser?.id;
			setIsHost(isHost.current);
			setRoundNumber(match.current_set);

			const mapped: KodPlayerState[] = players.map((p) => ({
				userId: p.user_id,
				points: p.score,
				isActive: p.score > 0,
				hasSubmitted: false,
			}));
			setPlayers(mapped);

			if (match.match_over) {
				setPhase("over");
				return;
			}

			if (!match.is_open) {
				setPhase("submitting");
				setInitialised(true);
				hasInited.current = true;
			}

			// Restore submitted state on reconnect
			if (currentRound && !currentRound.is_complete) {
				const myChoice = currentRound.choices?.find(
					(c) => c.user_id === currentUser?.id,
				);
				if (myChoice) {
					setSubmitted(true);
					setSubmittedVal(myChoice.value);
				}
			}
		} catch {
			// Match may not exist yet — not a fatal error
		}
	};

	// ── Init game (host only) ──────────────────────────────────────────────────
	const initGame = async () => {
		if (hasInited.current) return;
		hasInited.current = true;
		try {
			await kodApiService.initGame(matchId);
		} catch (err: any) {
			// "already started" is fine on reconnect
			if (!err?.message?.includes("déjà")) {
				setError(err?.message ?? "Erreur démarrage");
				hasInited.current = false;
			}
		}
	};

	// ── Socket wiring ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!matchId || !currentUser) return;

		const socket = socketStore.getSocket();
		if (!socket) return;

		// syncState();
		const onAuthSuccess = () => {
			syncState().then(() => {
				if (isHost.current) initGame();
			});
		};

		socket.on("auth:success", onAuthSuccess);

		// Also keep it as fallback if socket is already authenticated:
		// if (socket.connected && socket.userId) syncState();
		if (socket.connected) syncState();


		// ── kod:game-started ───────────────────────────────────────────────────
		const onGameStarted = (data: KodGameStartedPayload) => {
			setPlayers(data.players);
			setRoundNumber(data.roundNumber);
			setPhase("submitting");
			setSubmitted(false);
			setSubmittedVal(null);
			setProgress({ count: 0, total: data.players.filter((p) => p.isActive).length });
			setInitialised(true);
		};

		// ── match:started — lobby fired this; host must now call /init ─────────
		const onMatchStarted = () => {
			syncState().then(() => {
				if (isHost.current) initGame();
			});
		};

		// ── kod:choice-ack — only the submitter receives this ──────────────────
		const onChoiceAck = ({ value }: { value: number }) => {
			setSubmitted(true);
			setSubmittedVal(value);
		};

		// ── kod:player-submitted — progress counter, no values revealed ────────
		const onPlayerSubmitted = (data: KodPlayerSubmittedPayload) => {
			setProgress({ count: data.submittedCount, total: data.totalActive });
		};

		// ── kod:round-result — simultaneous reveal for everyone ───────────────
		const onRoundResult = (result: KodRoundResult) => {
			setLastResult(result);
			setPlayers(result.players);
			setPhase("revealing");
			setSubmitted(false);
			setSubmittedVal(null);
			setProgress({ count: 0, total: 0 });
		};

		// ── kod:next-round ────────────────────────────────────────────────────
		const onNextRound = (data: KodNextRoundPayload) => {
			setRoundNumber(data.roundNumber);
			setPhase("submitting");
			setLastResult(null);
			setError("");
		};

		// ── kod:game-over ─────────────────────────────────────────────────────
		const onGameOver = (data: KodGameOverPayload) => {
			setPlayers((prev) =>
				prev.map((p) => {
					const updated = data.players.find((u) => u.userId === p.userId);
					return updated ? { ...p, points: updated.points, isActive: updated.points > 0 } : p;
				}),
			);
			setPhase("over");
		};

		// ── socket error ──────────────────────────────────────────────────────
		const onError = ({ error }: { error: string }) => setError(error);

		socket.on("kod:game-started", onGameStarted);
		socket.on("match:started", onMatchStarted);
		socket.on("kod:choice-ack", onChoiceAck);
		socket.on("kod:player-submitted", onPlayerSubmitted);
		socket.on("kod:round-result", onRoundResult);
		socket.on("kod:next-round", onNextRound);
		socket.on("kod:game-over", onGameOver);
		socket.on("error", onError);

		return () => {
			socket.off("kod:game-started", onGameStarted);
			socket.off("match:started", onMatchStarted);
			socket.off("kod:choice-ack", onChoiceAck);
			socket.off("kod:player-submitted", onPlayerSubmitted);
			socket.off("kod:round-result", onRoundResult);
			socket.off("kod:next-round", onNextRound);
			socket.off("kod:game-over", onGameOver);
			socket.off("error", onError);
		};

	}, [matchId, currentUser]);

	return <>{children} </>;
}
