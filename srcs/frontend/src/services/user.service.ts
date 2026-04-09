import apiService from './api.service';
import type { User, UserCreate, UserUpdate, UserLogin, AuthResponse } from '../models';

class UserService {
	async register(data: UserCreate): Promise<{ user: { id: number; username: string; email: string } }> {
		return apiService.post<{ user: { id: number; username: string; email: string } }>('auth/register', data);
	}

	async login(data: UserLogin): Promise<AuthResponse> {
		const response = await apiService.post<AuthResponse>('auth/login', data);
		if (response.tokens?.accessToken && response.tokens?.refreshToken) {
			apiService.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
		}
		return response;
	}

	async logout(): Promise<void> {
		apiService.clearTokens();
	}

	async getMe(): Promise<User> {
		return apiService.get<User>('users/me');
	}

	async updateMe(data: UserUpdate): Promise<User> {
		return apiService.put<User>('users/me', data);
	}

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await apiService.put<{ message: string }>('users/me/password', { currentPassword, newPassword });
	}

	async resetPassword(userId: number, newPassword: string): Promise<void> {
		await apiService.post<{ message: string }>('users/reset-password', { userId, newPassword });
	}

	async checkEmail(email: string): Promise<{ id: number; username: string; email: string; avatar: string }> {
		return apiService.post<{ id: number; username: string; email: string; avatar: string }>('users/check-email', { email });
	}

	async getById(id: number): Promise<User> {
		return apiService.get<User>(`users/${id}`);
	}

	async getUserProfile(id: number): Promise<{ id: number; username: string; avatar: string; is_online: boolean; gamesPlayed: number; wins: number; losses: number }> {
		return apiService.get(`users/${id}/profile`);
	}
}

export const userService = new UserService();
export default userService;
