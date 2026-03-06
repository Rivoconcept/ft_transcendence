import apiService from './api.service';

class BlockService {
	async getBlockedUsers(): Promise<{ blockedIds: number[] }> {
		return apiService.get<{ blockedIds: number[] }>('blocks');
	}

	async blockUser(userId: number): Promise<{ message: string }> {
		return apiService.post<{ message: string }>(`blocks/${userId}`, {});
	}

	async unblockUser(userId: number): Promise<{ message: string }> {
		return apiService.delete<{ message: string }>(`blocks/${userId}`);
	}

	async isBlocked(userId: number): Promise<{ blocked: boolean }> {
		return apiService.get<{ blocked: boolean }>(`blocks/${userId}`);
	}
}

export const blockService = new BlockService();
export default blockService;
