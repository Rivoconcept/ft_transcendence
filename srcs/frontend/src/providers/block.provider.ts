import { atom } from 'jotai';
import { blockService } from '../services/block.service';
import { friendRelationsAtom } from './friend.provider';

// Set of blocked user IDs
export const blockedUserIdsAtom = atom<Set<number>>(new Set<number>());
export const blockedUsersLoadingAtom = atom<boolean>(false);

// Fetch blocked users list
export const fetchBlockedUsersAtom = atom(null, async (_get, set) => {
	set(blockedUsersLoadingAtom, true);
	try {
		const { blockedIds } = await blockService.getBlockedUsers();
		set(blockedUserIdsAtom, new Set(blockedIds));
	} catch {
		// silently fail
	} finally {
		set(blockedUsersLoadingAtom, false);
	}
});

// Block a user
export const blockUserAtom = atom(null, async (get, set, userId: number) => {
	try {
		await blockService.blockUser(userId);
		const current = get(blockedUserIdsAtom);
		set(blockedUserIdsAtom, new Set([...current, userId]));
		// Remove from friends list
		const relations = get(friendRelationsAtom);
		set(friendRelationsAtom, relations.filter(r => r.friendId !== userId));
	} catch (err: any) {
		throw err;
	}
});

// Unblock a user
export const unblockUserAtom = atom(null, async (get, set, userId: number) => {
	try {
		await blockService.unblockUser(userId);
		const current = get(blockedUserIdsAtom);
		const updated = new Set(current);
		updated.delete(userId);
		set(blockedUserIdsAtom, updated);
	} catch (err: any) {
		throw err;
	}
});

// Check if a specific user is blocked (derived atom)
export const isUserBlockedAtom = atom((get) => {
	const blockedIds = get(blockedUserIdsAtom);
	return (userId: number) => blockedIds.has(userId);
});
