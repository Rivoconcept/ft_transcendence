export interface ChatListItem {
	id: number;
	name: string | null;
	type: 'direct' | 'group';
	channel_id: string;
	created_at: string;
	lastMessageId: number | null;
	lastMessageContent: string | null;
	lastMessageDate: string | null;
	memberIds: number[];
}

export interface MessageItem {
	id: number;
	content: string;
	type: string;
	created_at: string;
	updated_at: string;
	authorId: number;
	chatId: number;
	reactions: { reactionId: number; userIds: number[] }[];
}

export interface PaginatedMessages {
	messages: MessageItem[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}
