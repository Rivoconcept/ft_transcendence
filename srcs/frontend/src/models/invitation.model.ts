import type { User } from './user.model';

export type InvitationStatus = 'pending' | 'accepted';

export interface Invitation {
	id: number;
	sender_id: number;
	receiver_id: number;
	status: InvitationStatus;
	created_at: string;
	sender?: User;
	receiver?: User;
}

export interface InvitationCreate {
	receiver_id: number;
}

export interface InvitationWithUser extends Invitation {
	sender: User;
	receiver: User;
}
