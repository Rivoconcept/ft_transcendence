import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import { currentUserAtom } from '../../../providers/user.provider';
import { friendsListAtom } from '../../../providers/friend.provider';
import { apiService } from '../../../services';

export type GameType = 'diceGame' | 'kingOfDiamond' | 'cardGame';
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

// ===== Client-side "real" tracking =====
// We track session minutes in localStorage per userId.
// This is "real" app usage time, independent of backend support.
const _sessionStartMsAtom = atom<number | null>(null);

const _onlineTimeByUserAtomFamily = atomFamily((userId: number) =>
	atomWithStorage<DailyOnlineTime[]>(`dashboard.onlineTime.v1.user.${userId}`, [])
);

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
});

export const onlineTimeAtom = atom((get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [];
	return get(_onlineTimeByUserAtomFamily(currentUser.id));
});

export const playtimeAtom = atom((get) => {
	const days = get(onlineTimeAtom);
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
	atom(async () => {
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
		const result = await get(_remoteCardGamesFamily(currentUser.id));
		return result;
	} catch (err) {
		console.error("Failed to fetch remote card games:", err);
		return [] as GameHistoryEntry[];
	}
});

export const gameHistoryAtom = atom(async (get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];

	const local = get(_gameHistoryByUserAtomFamily(currentUser.id));
	
	let remote: GameHistoryEntry[] = [];
	try {
		remote = await get(remoteCardGamesAtom);
	} catch (err) {
		console.error("Failed to get remote card games:", err);
	}

	// Merge + dedupe by id
	const map = new Map<string, GameHistoryEntry>();
	for (const r of [...remote, ...local]) map.set(r.id, r);
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

