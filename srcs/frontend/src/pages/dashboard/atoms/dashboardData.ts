import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { atomWithStorage, loadable } from 'jotai/utils';
import { currentUserAtom } from '../../../providers/user.provider';
import type { User } from '../../../models';
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

const _remoteCardGamesFamily = atomFamily((userId: number) =>
	atom(async () => {
		// Backend enforces auth; userId is used only for caching key.
		const rows = await apiService.get<CardGameApiRow[]>('card-games');
		return rows
			.map((r) => {
				const ts = Date.parse(r.created_at);
				return {
					id: `card-remote-${r.id}`,
					gameType: 'cardGame' as const,
					user: r.player_name ?? 'You',
					result: (r.is_win ? 'win' : 'loss') as GameResultKind,
					opponents: r.mode === 'MULTI' ? ['Multiplayer match'] : ['Computer'],
					isMultiplayer: r.mode === 'MULTI',
					timestamp: Number.isFinite(ts) ? ts : Date.now(),
					meta: {
						matchId: r.match_id,
						finalScore: r.final_score,
					},
				} satisfies GameHistoryEntry;
			})
			.sort((a, b) => b.timestamp - a.timestamp);
	})
);

export const remoteCardGamesAtom = atom((get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return { state: 'hasData', data: [] as GameHistoryEntry[] } as const;
	return get(loadable(_remoteCardGamesFamily(currentUser.id)));
});

export const gameHistoryAtom = atom((get) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) return [] as GameHistoryEntry[];

	const local = get(_gameHistoryByUserAtomFamily(currentUser.id));
	const remoteLoadable = get(remoteCardGamesAtom);
	const remote = remoteLoadable.state === 'hasData' ? remoteLoadable.data : [];

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

export const gameStatsAtom = atom((get) => {
	const history = get(gameHistoryAtom);
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

