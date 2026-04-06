import apiService from './api.service';
import type { ChatListItem, MessageItem, PaginatedMessages } from '../models';

class ChatService {
	async getChats(): Promise<ChatListItem[]> {
		return apiService.get<ChatListItem[]>('chats');
	}

	async getMessages(chatId: number, page: number = 1, limit: number = 50): Promise<PaginatedMessages> {
		return apiService.get<PaginatedMessages>(`chats/${chatId}/messages?page=${page}&limit=${limit}`);
	}

	async sendMessage(chatId: number, payload: { content: string; type?: string; socketId?: string }): Promise<MessageItem> {
		return apiService.post<MessageItem>(`chats/${chatId}/messages`, payload);
	}

	async createDirectChat(userId: number): Promise<ChatListItem> {
		return apiService.post<ChatListItem>('chats/direct', { userId });
	}

	async createGroupChat(name: string, memberIds: number[]): Promise<ChatListItem> {
		return apiService.post<ChatListItem>('chats/group', { name, memberIds });
	}

	async getChatById(chatId: number): Promise<ChatListItem> {
		return apiService.get<ChatListItem>(`chats/${chatId}`);
	}

	async markAsRead(chatId: number, messageId: number): Promise<{ readMessageId: number; userId: number }> {
		return apiService.post<{ readMessageId: number; userId: number }>(`chats/${chatId}/read`, { messageId });
	}

	async leaveGroup(chatId: number): Promise<void> {
		await apiService.post<{ message: string }>(`chats/${chatId}/leave`, {});
	}

	async toggleModerator(chatId: number, targetUserId: number): Promise<{ isModerator: boolean }> {
		return apiService.post<{ isModerator: boolean }>(`chats/${chatId}/moderator`, { targetUserId });
	}

	async kickMember(chatId: number, targetUserId: number): Promise<void> {
		await apiService.post<{ message: string }>(`chats/${chatId}/kick`, { targetUserId });
	}

	async joinGroup(channelId: string): Promise<ChatListItem> {
		return apiService.post<ChatListItem>(`chats/join/${channelId}`, {});
	}
}

export const chatService = new ChatService();
export default chatService;
