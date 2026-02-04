// User atoms - to be implemented with jotai
// import { atom } from 'jotai';
import type { User } from '../../models';

// Placeholder for jotai atoms
// Will be implemented as:
// export const userAtom = atom<User | null>(null);
// export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

export interface UserState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

export const initialUserState: UserState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
};
