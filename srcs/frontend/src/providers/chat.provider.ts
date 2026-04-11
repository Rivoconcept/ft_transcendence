import { atom } from 'jotai';
import { chatService } from '../services';
import { socketStore } from '../store/socketStore';
import type { ChatListItem, MessageItem, PaginatedMessages } from '../models';

// ============================================================
// CHAT LIST
// ============================================================

export const chatListAtom = atom<ChatListItem[]>([]);
export const chatListLoadingAtom = atom<boolean>(false);
export const chatListErrorAtom = atom<string | null>(null);

// Action: fetch all chats
export const fetchChatListAtom = atom(
	null,
	async (_get, set) => {
		set(chatListLoadingAtom, true);
		set(chatListErrorAtom, null);
		try {
			const chats = await chatService.getChats();
			set(chatListAtom, chats);
		} catch {
			set(chatListErrorAtom, 'Failed to load chats');
		} finally {
			set(chatListLoadingAtom, false);
		}
	}
);

// Derived: sorted by most recent activity
export const sortedChatListAtom = atom((get) => {
	const chats = get(chatListAtom);
	return [...chats].sort((a, b) => {
		const dateA = a.lastMessageDate ?? a.created_at;
		const dateB = b.lastMessageDate ?? b.created_at;
		return new Date(dateB).getTime() - new Date(dateA).getTime();
	});
});

// ============================================================
// SELECTED CHAT
// ============================================================

export const selectedChatIdAtom = atom<number | null>(null);

export const selectedChatAtom = atom((get) => {
	const id = get(selectedChatIdAtom);
	if (id === null) return null;
	return get(chatListAtom).find(c => c.id === id) ?? null;
});

// ============================================================
// PER-CHAT MESSAGES
// ============================================================

export interface ChatMessagesState {
	messages: MessageItem[];
	page: number;
	hasMore: boolean;
	loading: boolean;
}

export const chatMessagesMapAtom = atom<Record<number, ChatMessagesState>>({});

// Derived: messages for the selected chat
export const selectedChatMessagesAtom = atom<ChatMessagesState | null>((get) => {
	const chatId = get(selectedChatIdAtom);
	if (chatId === null) return null;
	return get(chatMessagesMapAtom)[chatId] ?? null;
});

// Action: load first page of messages for a chat
export const loadChatMessagesAtom = atom(
	null,
	async (get, set, chatId: number) => {
		const map = get(chatMessagesMapAtom);

		// Already loaded, skip
		if (map[chatId]?.messages.length > 0) return;

		set(chatMessagesMapAtom, {
			...map,
			[chatId]: { messages: [], page: 0, hasMore: true, loading: true }
		});

		try {
			const result: PaginatedMessages = await chatService.getMessages(chatId, 1, 50);
			set(chatMessagesMapAtom, {
				...get(chatMessagesMapAtom),
				[chatId]: {
					messages: result.messages,
					page: result.page,
					hasMore: result.hasMore,
					loading: false
				}
			});
		} catch {
			set(chatMessagesMapAtom, {
				...get(chatMessagesMapAtom),
				[chatId]: { messages: [], page: 0, hasMore: false, loading: false }
			});
		}
	}
);

// Action: load older messages (scroll up)
export const loadOlderMessagesAtom = atom(
	null,
	async (get, set, chatId: number) => {
		const map = get(chatMessagesMapAtom);
		const state = map[chatId];
		if (!state || state.loading || !state.hasMore) return;

		const nextPage = state.page + 1;

		set(chatMessagesMapAtom, {
			...map,
			[chatId]: { ...state, loading: true }
		});

		try {
			const result: PaginatedMessages = await chatService.getMessages(chatId, nextPage, 50);
			const currentMap = get(chatMessagesMapAtom);
			const currentState = currentMap[chatId];
			set(chatMessagesMapAtom, {
				...currentMap,
				[chatId]: {
					// Prepend older messages before existing
					messages: [...result.messages, ...currentState.messages],
					page: result.page,
					hasMore: result.hasMore,
					loading: false
				}
			});
		} catch {
			const currentMap = get(chatMessagesMapAtom);
			const currentState = currentMap[chatId];
			set(chatMessagesMapAtom, {
				...currentMap,
				[chatId]: { ...currentState, loading: false }
			});
		}
	}
);

// ============================================================
// SEND MESSAGE (optimistic)
// ============================================================

export const sendMessageAtom = atom(
	null,
	async (get, set, { chatId, content, type = 'text' }: { chatId: number; content: string; type?: string }) => {
		const map = get(chatMessagesMapAtom);
		const state = map[chatId];
		if (!state) return;

		const tempId = -Date.now();
		const optimisticMsg: MessageItem = {
			id: tempId,
			content,
			type,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			authorId: 0, // placeholder, component uses currentUserAtom to check fromMe
			chatId,
			deleted: false,
			reactions: [],
			readBy: []
		};

		// Optimistically append
		set(chatMessagesMapAtom, {
			...map,
			[chatId]: { ...state, messages: [...state.messages, optimisticMsg] }
		});

		try {
			const realMsg = await chatService.sendMessage(chatId, { content, type, socketId: socketStore.getSocketId() });
			const currentMap = get(chatMessagesMapAtom);
			const currentState = currentMap[chatId];
			set(chatMessagesMapAtom, {
				...currentMap,
				[chatId]: {
					...currentState,
					messages: currentState.messages.map(m => m.id === tempId ? realMsg : m)
				}
			});

			// Update last message info in chat list
			const chats = get(chatListAtom);
			set(chatListAtom, chats.map(c =>
				c.id === chatId ? { ...c, lastMessageId: realMsg.id, lastMessageContent: realMsg.content, lastMessageType: realMsg.type, lastMessageDate: realMsg.created_at } : c
			));
		} catch {
			// Remove optimistic message on failure
			const currentMap = get(chatMessagesMapAtom);
			const currentState = currentMap[chatId];
			set(chatMessagesMapAtom, {
				...currentMap,
				[chatId]: {
					...currentState,
					messages: currentState.messages.filter(m => m.id !== tempId)
				}
			});
		}
	}
);

// ============================================================
// SOCKET EVENT HELPERS
// ============================================================

// Called on "message:new"
export const onNewMessageAtom = atom(
	null,
	(get, set, message: MessageItem) => {
		const map = get(chatMessagesMapAtom);
		const state = map[message.chatId];

		if (state) {
			// Deduplicate: skip if already present by id
			if (state.messages.some(m => m.id === message.id)) return;

			// Check for optimistic message (negative id, same content) and replace it
			const optimisticIndex = state.messages.findIndex(m => m.id < 0 && m.content === message.content);
			if (optimisticIndex !== -1) {
				const updated = [...state.messages];
				updated[optimisticIndex] = message;
				set(chatMessagesMapAtom, {
					...map,
					[message.chatId]: { ...state, messages: updated }
				});
			} else {
				set(chatMessagesMapAtom, {
					...map,
					[message.chatId]: {
						...state,
						messages: [...state.messages, message]
					}
				});
			}
		}

		// Update last message info in chat list + increment unread count
		const chats = get(chatListAtom);
		const selectedId = get(selectedChatIdAtom);
		set(chatListAtom, chats.map(c =>
			c.id === message.chatId ? {
				...c,
				lastMessageId: message.id,
				lastMessageContent: message.content,
				lastMessageType: message.type,
				lastMessageDate: message.created_at,
				// Increment unread if this chat is not currently selected
				unreadCount: c.id !== selectedId ? c.unreadCount + 1 : c.unreadCount,
			} : c
		));
	}
);

// Called on "chat:created"
export const onChatCreatedAtom = atom(
	null,
	(get, set, chat: ChatListItem) => {
		const chats = get(chatListAtom);
		if (!chats.find(c => c.id === chat.id)) {
			set(chatListAtom, [chat, ...chats]);
		}
	}
);

// Action: open or create a direct chat, add to list, return chat id
export const openOrCreateDirectChatAtom = atom(
	null,
	async (get, set, friendId: number) => {
		const chat = await chatService.createDirectChat(friendId);

		// Add to chat list if not already present
		const chats = get(chatListAtom);
		if (!chats.find(c => c.id === chat.id)) {
			set(chatListAtom, [chat, ...chats]);
		}

		return chat.id;
	}
);

// Action: create a group chat, add to list, return chat id
export const createGroupChatAtom = atom(
	null,
	async (get, set, { name, memberIds }: { name: string; memberIds: number[] }) => {
		const chat = await chatService.createGroupChat(name, memberIds);
		const chats = get(chatListAtom);
		if (!chats.find(c => c.id === chat.id)) {
			set(chatListAtom, [chat, ...chats]);
		}
		return chat.id;
	}
);

// ============================================================
// UNREAD COUNT
// ============================================================

// Derived: total unread count across all chats
export const totalUnreadCountAtom = atom((get) => {
	const chats = get(chatListAtom);
	return chats.reduce((sum, c) => sum + c.unreadCount, 0);
});

// Action: mark messages as read up to a given message
export const markAsReadAtom = atom(
	null,
	async (get, set, { chatId, messageId }: { chatId: number; messageId: number }) => {
		try {
			await chatService.markAsRead(chatId, messageId);

			// Reset unread count for this chat
			const chats = get(chatListAtom);
			set(chatListAtom, chats.map(c =>
				c.id === chatId ? { ...c, unreadCount: 0 } : c
			));
		} catch {
			// silently fail
		}
	}
);

// Called on "message:deleted" WebSocket event
export const onMessageDeletedAtom = atom(
	null,
	(get, set, { chatId, messageId }: { chatId: number; messageId: number }) => {
		const map = get(chatMessagesMapAtom);
		const state = map[chatId];

		if (state) {
			const updatedMessages = state.messages.map(m => {
				if (m.id === messageId) {
					return { ...m, content: '', deleted: true };
				}
				return m;
			});

			set(chatMessagesMapAtom, {
				...map,
				[chatId]: { ...state, messages: updatedMessages }
			});
		}
	}
);

// Called on "message:read" WebSocket event
export const onMessageReadAtom = atom(
	null,
	(get, set, { chatId, messageId, userId }: { chatId: number; messageId: number; userId: number }) => {
		const map = get(chatMessagesMapAtom);
		const state = map[chatId];

		if (state) {
			// Add userId to readBy for the target message and all earlier messages
			const updatedMessages = state.messages.map(m => {
				if (m.id <= messageId && !m.readBy.includes(userId)) {
					return { ...m, readBy: [...m.readBy, userId] };
				}
				return m;
			});

			set(chatMessagesMapAtom, {
				...map,
				[chatId]: { ...state, messages: updatedMessages }
			});
		}
	}
);

// Action: select a chat (set id + load messages)
export const selectChatAtom = atom(
	null,
	async (_get, set, chatId: number | null) => {
		set(selectedChatIdAtom, chatId);
		if (chatId !== null) {
			await set(loadChatMessagesAtom, chatId);
		}
	}
);
