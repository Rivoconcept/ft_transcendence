// Invitation atoms - to be implemented with jotai
// import { atom } from 'jotai';
import type { Invitation, User } from '../../models';

// Placeholder for jotai atoms
// Will be implemented as:
// export const friendsAtom = atom<User[]>([]);
// export const pendingInvitationsAtom = atom<Invitation[]>([]);
// export const sentInvitationsAtom = atom<Invitation[]>([]);

export interface InvitationState {
	friends: User[];
	pendingInvitations: Invitation[];
	sentInvitations: Invitation[];
	isLoading: boolean;
	error: string | null;
}

export const initialInvitationState: InvitationState = {
	friends: [],
	pendingInvitations: [],
	sentInvitations: [],
	isLoading: false,
	error: null,
};
