import { atom } from 'jotai';
import { invitationService } from '../services';
import type { User } from '../models';
import { userCacheFamily } from './user.provider';
import { addFriendAtom } from './friend.provider';

// ============= RECEIVED INVITATIONS =============

// Invitation relation - just the link
export interface InvitationRelation {
	invitationId: number;
	senderId: number;
	status: 'pending' | 'accepted';
	createdAt: string;
}

// Received invitations (pending)
export const receivedInvitationsAtom = atom<InvitationRelation[]>([]);

// Loading state
export const receivedInvitationsLoadingAtom = atom<boolean>(false);

// Error state
export const receivedInvitationsErrorAtom = atom<string | null>(null);

// Derived atom - get invitations with sender details from cache
export const receivedInvitationsListAtom = atom((get) => {
	const relations = get(receivedInvitationsAtom);
	const invitations: Array<InvitationRelation & { sender: User | null }> = [];

	for (const relation of relations) {
		const sender = get(userCacheFamily(relation.senderId));
		invitations.push({
			...relation,
			sender
		});
	}

	return invitations;
});

// Action to fetch received invitations
export const fetchReceivedInvitationsAtom = atom(
	null,
	async (get, set) => {
		const isLoading = get(receivedInvitationsLoadingAtom);
		if (isLoading) return;

		set(receivedInvitationsLoadingAtom, true);
		set(receivedInvitationsErrorAtom, null);

		try {
			const invitations = await invitationService.getPending();

			const relations: InvitationRelation[] = [];
			for (const inv of invitations) {
				// Update sender in user cache if available
				if (inv.sender) {
					set(userCacheFamily(inv.sender.id), inv.sender);
				}

				relations.push({
					invitationId: inv.id,
					senderId: inv.sender_id,
					status: inv.status,
					createdAt: inv.created_at
				});
			}

			set(receivedInvitationsAtom, relations);
		} catch {
			set(receivedInvitationsErrorAtom, 'Failed to load invitations');
		} finally {
			set(receivedInvitationsLoadingAtom, false);
		}
	}
);

// Action to accept invitation
export const acceptInvitationAtom = atom(
	null,
	async (get, set, invitationId: number) => {
		try {
			const result = await invitationService.accept(invitationId);

			// Remove from received invitations
			const relations = get(receivedInvitationsAtom);
			const invitation = relations.find(r => r.invitationId === invitationId);
			set(receivedInvitationsAtom, relations.filter(r => r.invitationId !== invitationId));

			// Add sender to friends list
			if (invitation) {
				const sender = get(userCacheFamily(invitation.senderId));
				if (sender) {
					set(addFriendAtom, sender);
				}
			}

			return result;
		} catch {
			throw new Error('Failed to accept invitation');
		}
	}
);

// Action to decline invitation
export const declineInvitationAtom = atom(
	null,
	async (get, set, invitationId: number) => {
		try {
			await invitationService.decline(invitationId);

			// Remove from received invitations
			const relations = get(receivedInvitationsAtom);
			set(receivedInvitationsAtom, relations.filter(r => r.invitationId !== invitationId));
		} catch {
			throw new Error('Failed to decline invitation');
		}
	}
);

// ============= SENT INVITATIONS =============

// Sent invitation relation
export interface SentInvitationRelation {
	invitationId: number;
	receiverId: number;
	status: 'pending' | 'accepted';
	createdAt: string;
}

// Sent invitations
export const sentInvitationsAtom = atom<SentInvitationRelation[]>([]);

// Loading state
export const sentInvitationsLoadingAtom = atom<boolean>(false);

// Error state
export const sentInvitationsErrorAtom = atom<string | null>(null);

// Derived atom - get sent invitations with receiver details from cache
export const sentInvitationsListAtom = atom((get) => {
	const relations = get(sentInvitationsAtom);
	const invitations: Array<SentInvitationRelation & { receiver: User | null }> = [];

	for (const relation of relations) {
		const receiver = get(userCacheFamily(relation.receiverId));
		invitations.push({
			...relation,
			receiver
		});
	}

	return invitations;
});

// Action to fetch sent invitations
export const fetchSentInvitationsAtom = atom(
	null,
	async (get, set) => {
		const isLoading = get(sentInvitationsLoadingAtom);
		if (isLoading) return;

		set(sentInvitationsLoadingAtom, true);
		set(sentInvitationsErrorAtom, null);

		try {
			const invitations = await invitationService.getSent();

			const relations: SentInvitationRelation[] = [];
			for (const inv of invitations) {
				// Update receiver in user cache if available
				if (inv.receiver) {
					set(userCacheFamily(inv.receiver.id), inv.receiver);
				}

				relations.push({
					invitationId: inv.id,
					receiverId: inv.receiver_id,
					status: inv.status,
					createdAt: inv.created_at
				});
			}

			set(sentInvitationsAtom, relations);
		} catch {
			set(sentInvitationsErrorAtom, 'Failed to load sent invitations');
		} finally {
			set(sentInvitationsLoadingAtom, false);
		}
	}
);

// Action to send invitation
export const sendInvitationAtom = atom(
	null,
	async (get, set, username: string) => {
		try {
			const invitation = await invitationService.sendByUsername(username);

			// Update receiver in cache if available
			if (invitation.receiver) {
				set(userCacheFamily(invitation.receiver.id), invitation.receiver);
			}

			// Add to sent invitations
			const relations = get(sentInvitationsAtom);
			set(sentInvitationsAtom, [...relations, {
				invitationId: invitation.id,
				receiverId: invitation.receiver_id,
				status: invitation.status,
				createdAt: invitation.created_at
			}]);

			return invitation;
		} catch {
			throw new Error('Failed to send invitation');
		}
	}
);

// Action to cancel sent invitation
export const cancelInvitationAtom = atom(
	null,
	async (get, set, invitationId: number) => {
		try {
			await invitationService.cancel(invitationId);

			// Remove from sent invitations
			const relations = get(sentInvitationsAtom);
			set(sentInvitationsAtom, relations.filter(r => r.invitationId !== invitationId));
		} catch {
			throw new Error('Failed to cancel invitation');
		}
	}
);
