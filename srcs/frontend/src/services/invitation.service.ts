import apiService from './api.service';
import type { Invitation, InvitationCreate, User } from '../models';

class InvitationService {
	async send(data: InvitationCreate): Promise<Invitation> {
		return apiService.post<Invitation>('invitations', data);
	}

	async sendByUsername(username: string): Promise<Invitation> {
		return apiService.post<Invitation>('invitations', { username });
	}

	async getPending(): Promise<Invitation[]> {
		return apiService.get<Invitation[]>('invitations/pending');
	}

	async getSent(): Promise<Invitation[]> {
		return apiService.get<Invitation[]>('invitations/sent');
	}

	async getFriends(): Promise<User[]> {
		return apiService.get<User[]>('invitations/friends');
	}

	async getFriendIds(): Promise<number[]> {
		return apiService.get<number[]>('invitations/friends');
	}

	async getNonFriends(): Promise<User[]> {
		return apiService.get<User[]>('invitations/non-friends');
	}

	async accept(id: number): Promise<Invitation> {
		return apiService.post<Invitation>(`invitations/${id}/accept`);
	}

	async cancel(id: number): Promise<void> {
		return apiService.post<void>(`invitations/${id}/cancel`);
	}

	async decline(id: number): Promise<void> {
		return apiService.post<void>(`invitations/${id}/cancel`);
	}
}

export const invitationService = new InvitationService();
export default invitationService;
