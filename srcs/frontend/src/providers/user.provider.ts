import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { loadable } from 'jotai/utils';
import { userService, apiService } from '../services';
import { socketStore } from '../store/socketStore';
import type { User, UserUpdate } from '../models';
import { friendRelationsAtom, friendsLoadingAtom, friendsErrorAtom } from './friend.provider';
import {
	receivedInvitationsAtom,
	receivedInvitationsLoadingAtom,
	receivedInvitationsErrorAtom,
	sentInvitationsAtom,
	sentInvitationsLoadingAtom,
	sentInvitationsErrorAtom
} from './invitation.provider';
import {
	chatListAtom,
	chatListLoadingAtom,
	chatListErrorAtom,
	chatMessagesMapAtom,
	selectedChatIdAtom
} from './chat.provider';

// Current authenticated user
export const currentUserAtom = atom<User | null>(null);

// Loading state for current user
export const currentUserLoadingAtom = atom<boolean>(false);

// === PRIVATE: Cache brut ===
const _userCacheFamily = atomFamily(
	(_userId: number) => atom<User | null>(null)
);

// === PRIVATE: Async family avec fetch auto si pas en cache ===
const _userAsyncFamily = atomFamily((userId: number) =>
	atom(async (get) => {
		const cached = get(_userCacheFamily(userId));
		if (cached) return cached;
		// Fetch si pas en cache
		return await userService.getById(userId);
	})
);

// === PUBLIC: Pour l'UI avec loading state ===
export const userFamily = atomFamily((userId: number) =>
	loadable(_userAsyncFamily(userId))
);

// === PUBLIC: Cache pour lecture/écriture synchrone (providers, socket events) ===
export const userCacheFamily = _userCacheFamily;

// Action to update user in cache
export const updateUserCacheAtom = atom(
	null,
	(_get, set, user: User) => {
		set(_userCacheFamily(user.id), user);
	}
);

// Action to update multiple users in cache
export const updateUsersCacheAtom = atom(
	null,
	(_get, set, users: User[]) => {
		users.forEach(user => {
			set(_userCacheFamily(user.id), user);
		});
	}
);

// Action to fetch user and store in cache (for socket events)
export const fetchUserToCacheAtom = atom(
	null,
	async (get, set, userId: number) => {
		// Skip if already in cache
		const cached = get(_userCacheFamily(userId));
		if (cached) return cached;

		try {
			const user = await userService.getById(userId);
			set(_userCacheFamily(userId), user);
			return user;
		} catch {
			return null;
		}
	}
);

// Initialize current user from token
export const initCurrentUserAtom = atom(
	null,
	async (_get, set) => {
		set(currentUserLoadingAtom, true);
		try {
			const user = await userService.getMe();
			set(currentUserAtom, user);
			set(_userCacheFamily(user.id), user);
			// Connect socket - backend will set is_online to true
			const token = apiService.getToken();
			if (token) {
				socketStore.connectAndAuth(token);
			}
		} catch {
			set(currentUserAtom, null);
		} finally {
			set(currentUserLoadingAtom, false);
		}
	}
);

// Login action
export const loginAtom = atom(
	null,
	async (_get, set, data: { username: string; password: string }) => {
		const response = await userService.login(data);
		set(currentUserAtom, response.user);
		set(_userCacheFamily(response.user.id), response.user);
		// Connect socket with token - backend will set is_online to true
		const token = apiService.getToken();
		if (token) {
			socketStore.connectAndAuth(token);
		}
		return response.user;
	}
);

// Register action
// Note: we intentionally do NOT set currentUserAtom here.
// This allows the UI to gate first-time access behind a terms-of-service step
// before completing authentication and socket connection.
export const registerAtom = atom(
	null,
	async (_get, _set, data: { username: string; realname: string; avatar: null | string; password: string }) => {
		const response = await userService.register(data);
		// Tokens are stored by userService.register; caller can later
		// finalize authentication (e.g. via initCurrentUserAtom) after ToS acceptance.
		return response.user;
	}
);

// Update current user profile
export const updateCurrentUserAtom = atom(
	null,
	async (get, set, data: UserUpdate) => {
		const currentUser = get(currentUserAtom);
		if (!currentUser) {
			throw new Error('No authenticated user');
		}

		const updatedUser = await userService.updateMe(data);
		set(currentUserAtom, updatedUser);
		set(_userCacheFamily(updatedUser.id), updatedUser);
		return updatedUser;
	}
);

// Logout action - clears all caches
export const logoutAtom = atom(
	null,
	(_get, set) => {
		userService.logout();
		socketStore.disconnect();

		// Clear user state
		set(currentUserAtom, null);
		set(currentUserLoadingAtom, false);

		// Clear friends cache
		set(friendRelationsAtom, []);
		set(friendsLoadingAtom, false);
		set(friendsErrorAtom, null);

		// Clear invitations cache
		set(receivedInvitationsAtom, []);
		set(receivedInvitationsLoadingAtom, false);
		set(receivedInvitationsErrorAtom, null);
		set(sentInvitationsAtom, []);
		set(sentInvitationsLoadingAtom, false);
		set(sentInvitationsErrorAtom, null);

		// Clear chat cache
		set(chatListAtom, []);
		set(chatListLoadingAtom, false);
		set(chatListErrorAtom, null);
		set(chatMessagesMapAtom, {});
		set(selectedChatIdAtom, null);

		// Note: atomFamily caches will be cleared on next login with fresh data
	}
);
