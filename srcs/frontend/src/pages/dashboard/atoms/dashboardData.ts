import { atom } from 'jotai';
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

function mergeDailyOnlineTime(days: DailyOnlineTime[], date: string, minutesToAdd: number): DailyOnlineTime[] {
	if (minutesToAdd <= 0) return days;

	return days.some((entry) => entry.date === date)
		? days.map((entry) => (entry.date === date ? { ...entry, minutes: entry.minutes + minutesToAdd } : entry))
		: [...days, { date, minutes: minutesToAdd }];
}

export const onlineTimeRefreshTriggerAtom = atom(0);
export const onlineTimeLiveTickAtom = atom(0);
export const gameHistoryRefreshTriggerAtom = atom(0);
export const refreshGameHistoryAtom = atom(null, (get, set) => {
	set(gameHistoryRefreshTriggerAtom, get(gameHistoryRefreshTriggerAtom) + 1);
});
// ===== Client-side "real" tracking with backend sync =====
// We track session minutes in localStorage per userId, but sync to backend
// This is "real" app usage time, independent of backend support.
const _sessionStartMsAtom = atom<number | null>(null);

const _onlineTimeAtom = atomWithStorage<DailyOnlineTime[]>(
	'dashboard.onlineTime.v1',
	[]
);

// Fetch online time from backend
const _remoteOnlineTimeAtom = atom(async (get) => {
	get(onlineTimeRefreshTriggerAtom);

	try {
		const rows = await apiService.get<DailyOnlineTime[]>('user-online-time');
		return rows;
	} catch {
		return [] as DailyOnlineTime[];
	}
});

export const remoteOnlineTimeAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as DailyOnlineTime[];
	return await get(_remoteOnlineTimeAtom);
});

export const startOnlineSessionAtom = atom(null, (get, set) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return;
	if (get(_sessionStartMsAtom) !== null) return;
	set(_sessionStartMsAtom, Date.now());
	set(onlineTimeLiveTickAtom, get(onlineTimeLiveTickAtom) + 1);
});

export const flushOnlineSessionAtom = atom(null, (get, set) => {
	const currentUser = get(currentUserAtom);
	const startedAt = get(_sessionStartMsAtom);
	if (!currentUser || startedAt === null) return;

	const now = Date.now();
	const elapsedMs = now - startedAt;
	const minutes = Math.floor(elapsedMs / 60000);
	if (minutes <= 0) return;

	const today = isoDate(new Date());
	const existing = get(_onlineTimeAtom);
	const next = mergeDailyOnlineTime(existing, today, minutes);
	set(_onlineTimeAtom, next);
	set(_sessionStartMsAtom, startedAt + (minutes * 60000));

	// Sync to backend
	apiService.post('user-online-time/add', { date: today, minutes }).catch(() => {});

	set(onlineTimeRefreshTriggerAtom, get(onlineTimeRefreshTriggerAtom) + 1);
	set(onlineTimeLiveTickAtom, get(onlineTimeLiveTickAtom) + 1);
});

export const stopOnlineSessionAtom = atom(null, (get, set) => {
	const currentUser = get(currentUserAtom);
	const startedAt = get(_sessionStartMsAtom);
	if (!currentUser || startedAt === null) return;

	set(flushOnlineSessionAtom);
	set(_sessionStartMsAtom, null);
	set(onlineTimeLiveTickAtom, get(onlineTimeLiveTickAtom) + 1);
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
	} catch {
	}

	// Fall back to localStorage data
	return get(_onlineTimeAtom);
});

export const playtimeAtom = atom(async (get) => {
	const days = await get(onlineTimeAtom);
	const storedMinutes = days.reduce((sum, d) => sum + d.minutes, 0);

	get(onlineTimeLiveTickAtom);
	const startedAt = get(_sessionStartMsAtom);
	if (startedAt === null) {
		return storedMinutes;
	}

	return storedMinutes + Math.floor((Date.now() - startedAt) / 60000);
});

export const playtimeSecondsAtom = atom(async (get) => {
	const days = await get(onlineTimeAtom);
	const storedSeconds = days.reduce((sum, d) => sum + (d.minutes * 60), 0);

	get(onlineTimeLiveTickAtom);
	const startedAt = get(_sessionStartMsAtom);
	if (startedAt === null) {
		return storedSeconds;
	}

	return storedSeconds + Math.max(Math.floor((Date.now() - startedAt) / 1000), 0);
});

// ===== Game history persistence (client-side) =====
const _gameHistoryAtom = atomWithStorage<GameHistoryEntry[]>(
	'dashboard.gameHistory.v1',
	[]
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

		const current = get(_gameHistoryAtom);
		set(_gameHistoryAtom, safeSortDescByTimestamp([nextEntry, ...current]));
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

const _remoteCardGamesAtom = atom(async (get) => {
	get(gameHistoryRefreshTriggerAtom);

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
					opponents = opponents.length > 0 ? opponents : ['John Doe'];
				} catch {
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
});

export const remoteCardGamesAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];
	try {
		return await get(_remoteCardGamesAtom);
	} catch {
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

const _remoteKodGamesAtom = atom(async (get) => {
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
					opponents = opponents.length > 0 ? opponents : ['John Doe'];
				} catch {
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
					remainingPoints: r.remaining_points,
					totalRounds: r.total_rounds,
				},
			} satisfies GameHistoryEntry;
		})
	).then((entries) => entries.sort((a, b) => b.timestamp - a.timestamp));
});

export const remoteKodGamesAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];
	try {
		return await get(_remoteKodGamesAtom);
	} catch {
		return [] as GameHistoryEntry[];
	}
});

export const gameHistoryAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];

	const local = get(_gameHistoryAtom);

	let remoteCard: GameHistoryEntry[] = [];
	let remoteKod: GameHistoryEntry[] = [];

	try {
		remoteCard = await get(remoteCardGamesAtom);
	} catch {
	}

	try {
		remoteKod = await get(remoteKodGamesAtom);
	} catch {
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
