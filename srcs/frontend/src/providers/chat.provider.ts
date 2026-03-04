import { atom } from 'jotai';
import { chatService } from '../services';
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
	async (get, set) => {
		if (get(chatListLoadingAtom)) return;
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

// Derived: sorted by most recent activity (backend already sorts, but keep for safety)
export const sortedChatListAtom = atom((get) => {
	const chats = get(chatListAtom);
	return [...chats].sort((a, b) => (b.lastMessageId ?? 0) - (a.lastMessageId ?? 0));
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
	async (get, set, { chatId, content }: { chatId: number; content: string }) => {
		const map = get(chatMessagesMapAtom);
		const state = map[chatId];
		if (!state) return;

		const tempId = -Date.now();
		const optimisticMsg: MessageItem = {
			id: tempId,
			content,
			type: 'text',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			authorId: 0, // placeholder, component uses currentUserAtom to check fromMe
			chatId,
			reactions: []
		};

		// Optimistically append
		set(chatMessagesMapAtom, {
			...map,
			[chatId]: { ...state, messages: [...state.messages, optimisticMsg] }
		});

		try {
			const realMsg = await chatService.sendMessage(chatId, { content, type: 'text' });
			const currentMap = get(chatMessagesMapAtom);
			const currentState = currentMap[chatId];
			set(chatMessagesMapAtom, {
				...currentMap,
				[chatId]: {
					...currentState,
					messages: currentState.messages.map(m => m.id === tempId ? realMsg : m)
				}
			});

			// Update lastMessageId in chat list
			const chats = get(chatListAtom);
			set(chatListAtom, chats.map(c =>
				c.id === chatId ? { ...c, lastMessageId: realMsg.id } : c
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
			// Deduplicate (sender already has it via optimistic update)
			if (state.messages.some(m => m.id === message.id)) return;

			set(chatMessagesMapAtom, {
				...map,
				[message.chatId]: {
					...state,
					messages: [...state.messages, message]
				}
			});
		}

		// Update lastMessageId in chat list
		const chats = get(chatListAtom);
		set(chatListAtom, chats.map(c =>
			c.id === message.chatId ? { ...c, lastMessageId: message.id } : c
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
