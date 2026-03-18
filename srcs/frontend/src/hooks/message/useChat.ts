import { useState } from "react"
import { useAtomValue, useSetAtom } from "jotai";

import {
	currentUserAtom,
	sortedChatListAtom,
	chatListLoadingAtom,
	fetchChatListAtom,
	selectedChatAtom,
	selectedChatIdAtom,
	selectedChatMessagesAtom,
	selectChatAtom,
	loadOlderMessagesAtom,
	sendMessageAtom,
	// userFamily,
	blockedUserIdsAtom,
	fetchBlockedUsersAtom,
	blockUserAtom,
	unblockUserAtom,
} from "../../providers";

export const useChat = () => {

    const [input, setInput] =                       useState("")
    const [search, setSearch] =                     useState("")
    const [showCreateModal, setShowCreateModal] =   useState(false)
    const [imagePreview, setImagePreview] =         useState<string | null>(null)
    const [imageError, setImageError] =             useState<string | null>(null)
    const [showDropdown, setShowDropdown] =         useState(false)
    const [isChatBlocked, setIsChatBlocked] =       useState(false)
    
    const selectChat =          useSetAtom(selectChatAtom);
    const fetchChats =          useSetAtom(fetchChatListAtom);
    const fetchBlockedUsers =   useSetAtom(fetchBlockedUsersAtom);
    const doBlockUser =         useSetAtom(blockUserAtom);
    const doUnblockUser =       useSetAtom(unblockUserAtom);
    const doSendMessage =       useSetAtom(sendMessageAtom);
    const loadOlder =           useSetAtom(loadOlderMessagesAtom);
    const chats =               useAtomValue(sortedChatListAtom);
    const selectedChat =        useAtomValue(selectedChatAtom);
    const selectedChatId =      useAtomValue(selectedChatIdAtom);
    const chatsLoading =        useAtomValue(chatListLoadingAtom);
    const currentUser =         useAtomValue(currentUserAtom);
    const blockedUserIds =      useAtomValue(blockedUserIdsAtom);
    const messagesState =       useAtomValue(selectedChatMessagesAtom);

    const messages = messagesState?.messages ?? [];
	const hasMore = messagesState?.hasMore ?? false;
	const isLoading = messagesState?.loading ?? false;
	const messagesReady = messagesState !== null && !isLoading;

    const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

    const getOtherUserId = (chat: ChatListItem): number => {
        if (chat.type === "direct" && currentUser) {
            return chat.memberIds.find(id => id !== currentUser.id) ?? chat.memberIds[0];
        }
        return chat.memberIds[0];
    };

    const filtered = chats.filter(c => {
		if (!search.trim()) return true;
		const name = c.name ?? "";
		return name.toLowerCase().includes(search.toLowerCase());
	});
}