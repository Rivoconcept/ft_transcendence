import apiService from './api.service';
import type { User, UserCreate, UserUpdate, UserLogin, AuthResponse } from '../models';

class UserService {
	async register(data: UserCreate): Promise<AuthResponse> {
		const response = await apiService.post<AuthResponse>('auth/register', data);
		if (response.tokens?.accessToken && response.tokens?.refreshToken) {
			apiService.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
		}
		return response;
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

	async getById(id: number): Promise<User> {
		return apiService.get<User>(`users/${id}`);
	}
}

export const userService = new UserService();
export default userService;
