import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { userService, apiService } from '../services';
import { socketStore } from '../store/socketStore';
import type { User } from '../models';
import { friendRelationsAtom, friendsLoadingAtom, friendsErrorAtom } from './friend.provider';
import {
	receivedInvitationsAtom,
	receivedInvitationsLoadingAtom,
	receivedInvitationsErrorAtom,
	sentInvitationsAtom,
	sentInvitationsLoadingAtom,
	sentInvitationsErrorAtom
} from './invitation.provider';

// Current authenticated user
export const currentUserAtom = atom<User | null>(null);

// Loading state for current user
export const currentUserLoadingAtom = atom<boolean>(false);

// User FamilyProvider - cache users by ID
// If user not in cache, fetches from API
export const userFamilyProvider = atomFamily(
	(_userId: number) => atom<User | null>(null)
);

// Async loading state for user family
export const userLoadingFamilyProvider = atomFamily(
	(_userId: number) => atom<boolean>(false)
);

// Error state for user family
export const userErrorFamilyProvider = atomFamily(
	(_userId: number) => atom<string | null>(null)
);

// Action to fetch and cache a user
export const fetchUserAtom = atom(
	null,
	async (get, set, userId: number) => {
		// Check if already loaded
		const existingUser = get(userFamilyProvider(userId));
		if (existingUser) return existingUser;

		// Check if already loading
		const isLoading = get(userLoadingFamilyProvider(userId));
		if (isLoading) return null;

		set(userLoadingFamilyProvider(userId), true);
		set(userErrorFamilyProvider(userId), null);

		try {
			const user = await userService.getById(userId);
			set(userFamilyProvider(userId), user);
			return user;
		} catch (error) {
			set(userErrorFamilyProvider(userId), 'Failed to load user');
			return null;
		} finally {
			set(userLoadingFamilyProvider(userId), false);
		}
	}
);

// Action to update user in cache (called when friends/invitations are loaded)
export const updateUserCacheAtom = atom(
	null,
	(_get, set, user: User) => {
		set(userFamilyProvider(user.id), user);
	}
);

// Action to update multiple users in cache
export const updateUsersCacheAtom = atom(
	null,
	(_get, set, users: User[]) => {
		users.forEach(user => {
			set(userFamilyProvider(user.id), user);
		});
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
			// Also cache in family provider
			set(userFamilyProvider(user.id), user);
			// Connect socket with token
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
		set(userFamilyProvider(response.user.id), response.user);
		// Connect socket with token
		const token = apiService.getToken();
		if (token) {
			socketStore.connectAndAuth(token);
		}
		return response.user;
	}
);

// Register action
export const registerAtom = atom(
	null,
	async (_get, set, data: { username: string; realname: string; avatar: string; password: string }) => {
		const response = await userService.register(data);
		set(currentUserAtom, response.user);
		set(userFamilyProvider(response.user.id), response.user);
		// Connect socket with token
		const token = apiService.getToken();
		if (token) {
			socketStore.connectAndAuth(token);
		}
		return response.user;
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

		// Note: atomFamily caches (userFamilyProvider) will be cleared
		// indirectly since relations are empty, and on next login fresh data loads
	}
);
