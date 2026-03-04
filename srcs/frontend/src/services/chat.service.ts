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
}

export const chatService = new ChatService();
export default chatService;
