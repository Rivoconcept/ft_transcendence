import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import { currentUserAtom } from '../../../providers/user.provider';
import { friendsListAtom } from '../../../providers/friend.provider';
import { apiService } from '../../../services';

export type GameType = 'kingOfDiamond' | 'cardGame';
export type GameResultKind = 'win' | 'loss';

export interface GameHistoryEntry {
	id: string;
	gameType: GameType;
	user: string;
	result: GameResultKind;
	opponents: string[];
	isMultiplayer: boolean;
	timestamp: number;
	meta?: Record<string, unknown>;
}

export interface DailyOnlineTime {
	date: string; // YYYY-MM-DD
	minutes: number;
}

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function safeSortDescByTimestamp<T extends { timestamp: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

export const onlineTimeRefresTriggerAtom = atom(0);
export const gameHistoryRefreshTriggerAtom = atom(0);
export const refreshGameHistoryAtom = atom(null, (get, set) => {
	set(gameHistoryRefreshTriggerAtom, get(gameHistoryRefreshTriggerAtom) + 1);
});
// ===== Client-side "real" tracking with backend sync =====
// We track session minutes in localStorage per userId, but sync to backend
// This is "real" app usage time, independent of backend support.
const _sessionStartMsAtom = atom<number | null>(null);

const _onlineTimeByUserAtomFamily = atomFamily((userId: number) =>
	atomWithStorage<DailyOnlineTime[]>(`dashboard.onlineTime.v1.user.${userId}`, [])
);

// Fetch online time from backend
const _remoteOnlineTimeFamily = atomFamily((userId: number) =>
	atom(async () => {
		try {
			const rows = await apiService.get<DailyOnlineTime[]>('user-online-time');
			return rows;
		} catch (err) {
			console.error('Failed to fetch remote online time:', err);
			return [] as DailyOnlineTime[];
		}
	})
);

export const remoteOnlineTimeAtom = atom(async (get) => {
	get(onlineTimeRefresTriggerAtom);
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as DailyOnlineTime[];
	return await get(_remoteOnlineTimeFamily(currentUser.id));
});

export const startOnlineSessionAtom = atom(null, (get, set) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return;
	if (get(_sessionStartMsAtom) !== null) return;
	set(_sessionStartMsAtom, Date.now());
});

export const stopOnlineSessionAtom = atom(null, (get, set) => {
	const currentUser = get(currentUserAtom);
	const startedAt = get(_sessionStartMsAtom);
	if (!currentUser || startedAt === null) return;

	const now = Date.now();
	const minutes = Math.max(0, Math.round((now - startedAt) / 60000));
	set(_sessionStartMsAtom, null);
	if (minutes === 0) return;

	const keyAtom = _onlineTimeByUserAtomFamily(currentUser.id);
	const today = isoDate(new Date());
	const existing = get(keyAtom);
	const next = existing.some((e) => e.date === today)
		? existing.map((e) => (e.date === today ? { ...e, minutes: e.minutes + minutes } : e))
		: [...existing, { date: today, minutes }];
	set(keyAtom, next);

	// Sync to backend
	apiService.post('user-online-time/add', { date: today, minutes }).catch((err) => {
		console.error('Failed to sync online time to backend:', err);
	});
});

export const onlineTimeAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [];

	try {
		// Try to fetch from backend first
		const remoteTime = await get(remoteOnlineTimeAtom);
		if (remoteTime && remoteTime.length > 0) {
			return remoteTime;
		}
	} catch (err) {
		console.warn('Failed to fetch remote online time, falling back to localStorage:', err);
	}

	// Fall back to localStorage data
	return get(_onlineTimeByUserAtomFamily(currentUser.id));
});

export const playtimeAtom = atom(async (get) => {
	const days = await get(onlineTimeAtom);
	return days.reduce((sum, d) => sum + d.minutes, 0);
});

// ===== Game history persistence (client-side) =====
const _gameHistoryByUserAtomFamily = atomFamily((userId: number) =>
	atomWithStorage<GameHistoryEntry[]>(`dashboard.gameHistory.v1.user.${userId}`, [])
);

export const appendGameHistoryAtom = atom(
	null,
	(get, set, entry: Omit<GameHistoryEntry, 'id' | 'timestamp' | 'user'> & { user?: string; timestamp?: number }) => {
		const currentUser = get(currentUserAtom);
		if (!currentUser) return;

		const userName = entry.user ?? currentUser.username;
		const timestamp = entry.timestamp ?? Date.now();
		const id = `${timestamp}-${Math.random().toString(16).slice(2)}`;
		const nextEntry: GameHistoryEntry = {
			id,
			user: userName,
			timestamp,
			...entry,
		};

		const historyAtom = _gameHistoryByUserAtomFamily(currentUser.id);
		const current = get(historyAtom);
		set(historyAtom, safeSortDescByTimestamp([nextEntry, ...current]));
	}
);

// ===== Backend: Card games history (real server data) =====
interface CardGameApiRow {
	id: number;
	mode: 'SINGLE' | 'MULTI';
	player_name?: string;
	final_score: number;
	is_win: boolean;
	match_id: string | null;
	created_at: string; // ISO
	author_id: number;
}

const _remoteCardGamesFamily = atomFamily((_userId: number) =>
	atom(async (get) => {
		get(gameHistoryRefreshTriggerAtom);
		// atomFamily(_userId) creates a separate cached atom per user
		// Backend enforces auth and returns only the current user's card games
		const rows = await apiService.get<CardGameApiRow[]>('card-games');

		return Promise.all(
			rows.map(async (r) => {
				const ts = Date.parse(r.created_at);

				let opponents: string[] = ['Computer'];

				// For multiplayer matches, fetch real opponent names
				if (r.mode === 'MULTI' && r.match_id) {
					try {
						const matchResults = await apiService.get<Array<{ player_name: string }>>(`card-games/match/${r.match_id}`);
						opponents = matchResults
							.filter(p => p.player_name !== r.player_name)
							.map(p => p.player_name);
					} catch (err) {
						console.error(`Failed to fetch opponents for match ${r.match_id}:`, err);
						opponents = ['Multiplayer match'];
					}
				}

				return {
					id: `card-remote-${r.id}`,
					gameType: 'cardGame' as const,
					user: r.player_name ?? 'You',
					result: (r.is_win ? 'win' : 'loss') as GameResultKind,
					opponents,
					isMultiplayer: r.mode === 'MULTI',
					timestamp: Number.isFinite(ts) ? ts : Date.now(),
					meta: {
						matchId: r.match_id,
						finalScore: r.final_score,
					},
				} satisfies GameHistoryEntry;
			})
		).then(entries => entries.sort((a, b) => b.timestamp - a.timestamp));
	})
);

export const remoteCardGamesAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];
	try {
		return await get(_remoteCardGamesFamily(currentUser.id));
	} catch (err) {
		console.error('Failed to fetch remote card games:', err);
		return [] as GameHistoryEntry[];
	}
});

// ===== Backend: KOD (King of Diamond) history =====

interface KodGameApiRow {
	id: number;
	match_id: string;
	is_win: boolean;
	player_name: string;
	remaining_points: number;
	total_rounds: number;
	created_at: string;
	mode: 'SINGLE' | 'MULTI';
}

const _remoteKodGamesFamily = atomFamily((_userId: number) =>
	atom(async (get) => {
		get(gameHistoryRefreshTriggerAtom);
		const rows = await apiService.get<KodGameApiRow[]>('kod-games');

		return Promise.all(
			rows.map(async (r) => {
				const ts = Date.parse(r.created_at);
				let opponents: string[] = ['Computer'];

				if (r.mode === 'MULTI' && r.match_id) {
					try {
						const matchResults = await apiService.get<Array<{ player_name: string }>>(
							`kod-games/match/${r.match_id}`
						);
						opponents = matchResults
							.filter((p) => p.player_name !== r.player_name)
							.map((p) => p.player_name);
					} catch (err) {
						console.error(
							`Failed to fetch KOD opponents for match ${r.match_id}:`,
							err
						);
						opponents = ['Multiplayer match'];
					}
				}

				return {
					id: `kod-remote-${r.id}`,
					gameType: 'kingOfDiamond' as const,
					user: r.player_name,
					result: (r.is_win ? 'win' : 'loss') as GameResultKind,
					opponents,
					isMultiplayer: r.mode === 'MULTI',
					timestamp: Number.isFinite(ts) ? ts : Date.now(),
					meta: {
						matchId: r.match_id,
						remainingPoints: r.remaining_points,  // KOD-specific
						totalRounds: r.total_rounds,           // KOD-specific
					},
				} satisfies GameHistoryEntry;
			})
		).then((entries) => entries.sort((a, b) => b.timestamp - a.timestamp));
	})
);

export const remoteKodGamesAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];
	try {
		return await get(_remoteKodGamesFamily(currentUser.id));
	} catch (err) {
		console.error('Failed to fetch remote KOD games:', err);
		return [] as GameHistoryEntry[];
	}
});

export const gameHistoryAtom = atom(async (get) => {
	get(gameHistoryRefreshTriggerAtom);
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];

	const local = get(_gameHistoryByUserAtomFamily(currentUser.id));

	let remoteCard: GameHistoryEntry[] = [];
	let remoteKod: GameHistoryEntry[] = [];

	try {
		remoteCard = await get(remoteCardGamesAtom);
	} catch (err) {
		console.error('Failed to get remote card games:', err);
	}

	try {
		remoteKod = await get(remoteKodGamesAtom);
	} catch (err) {
		console.error('Failed to get remote KOD games:', err);
	}

	// Merge and dedupe by id — remote takes precedence over local
	const map = new Map<string, GameHistoryEntry>();
	for (const entry of [...remoteCard, ...remoteKod, ...local]) {
		map.set(entry.id, entry);
	}
	return safeSortDescByTimestamp(Array.from(map.values()));
});

// ===== Stats derived from game history =====
export interface GameResult {
	id: string;
	game: GameType;
	result: GameResultKind;
	timestamp: number;
}

export type StatsFilter = 'overall' | GameType;
export const gameStatsFilterAtom = atom<StatsFilter>('overall');

export const gameStatsAtom = atom(async (get) => {
	const history = await get(gameHistoryAtom);
	return history.map(
		(h) =>
			({
				id: h.id,
				game: h.gameType,
				result: h.result,
				timestamp: h.timestamp,
			}) satisfies GameResult
	);
});

// ===== Friends derived from existing providers =====
export interface FriendDashboardRow {
	id: number;
	name: string;
	online: boolean;
}

export const friendsAtom = atom((get) => {
	const friendsList = get(friendsListAtom);
	return friendsList.map(
		(u) =>
			({
				id: u.id,
				name: u.username,
				online: u.is_online,
			}) satisfies FriendDashboardRow
	);
});
