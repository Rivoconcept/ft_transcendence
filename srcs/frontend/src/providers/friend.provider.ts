import { atom } from 'jotai';
import { invitationService } from '../services';
import type { User } from '../models';
import { userCacheFamily } from './user.provider';

// Friend relation - just the link between current user and friend
export interface FriendRelation {
	friendId: number;
	status: 'accepted';
}

// Friends list (just relations)
export const friendRelationsAtom = atom<FriendRelation[]>([]);

// Loading state
export const friendsLoadingAtom = atom<boolean>(false);

// Error state
export const friendsErrorAtom = atom<string | null>(null);

// Derived atom - get friends list with full user data from cache
export const friendsListAtom = atom((get) => {
	const relations = get(friendRelationsAtom);
	const friends: User[] = [];

	for (const relation of relations) {
		const user = get(userCacheFamily(relation.friendId));
		if (user) {
			friends.push(user);
		}
	}
	return friends;
});

// Action to fetch friends and update user cache
export const fetchFriendsAtom = atom(
	null,
	async (get, set) => {
		const isLoading = get(friendsLoadingAtom);
		if (isLoading) return;

		set(friendsLoadingAtom, true);
		set(friendsErrorAtom, null);

		try {
			// API returns users with full details
			const friends = await invitationService.getFriends();

			// Update user cache for each friend
			const relations: FriendRelation[] = [];
			for (const friend of friends) {
				set(userCacheFamily(friend.id), friend);
				relations.push({
					friendId: friend.id,
					status: 'accepted'
				});
			}

			set(friendRelationsAtom, relations);
		} catch {
			set(friendsErrorAtom, 'Failed to load friends');
		} finally {
			set(friendsLoadingAtom, false);
		}
	}
);

// Action to remove a friend
export const removeFriendAtom = atom(
	null,
	async (get, set, friendId: number) => {
		try {
			await invitationService.removeFriend(friendId);
			const relations = get(friendRelationsAtom);
			set(friendRelationsAtom, relations.filter(r => r.friendId !== friendId));
		} catch {
			throw new Error('Failed to remove friend');
		}
	}
);

// Action to add a friend (when invitation is accepted)
export const addFriendAtom = atom(
	null,
	(get, set, friend: User) => {
		// Update user cache
		set(userCacheFamily(friend.id), friend);

		// Add to relations
		const relations = get(friendRelationsAtom);
		if (!relations.find(r => r.friendId === friend.id)) {
			set(friendRelationsAtom, [...relations, {
				friendId: friend.id,
				status: 'accepted'
			}]);
		}
	}
);
