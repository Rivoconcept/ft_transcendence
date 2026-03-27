import { useAtomValue, useSetAtom } from "jotai";
import { socketStore } from "../../store/socketStore";
import { 
    currentUserAtom,
    selectChatAtom,
    blockedUserIdsAtom,
    fetchBlockedUsersAtom,
    selectedChatAtom,
    selectedChatIdAtom,
    sortedChatListAtom,
    chatListLoadingAtom,
    fetchChatListAtom
} from "../../providers";
import { useNavigate } from "react-router-dom";
import {
    useState,
    useParams,
    useEffect
} from "react";
import type { ChatListItem } from "../../models";

export const useChat = () => {

    const { chatId: chatIdParam } = useParams<{ chatId?: string }>();

    const selectChat = useSetAtom(selectChatAtom);

    const navigate = useNavigate();
    const currentUser = useAtomValue(currentUserAtom);
    const blockedUserIds = useAtomValue(blockedUserIdsAtom);
    const fetchBlockedUsers = useSetAtom(fetchBlockedUsersAtom);
    const selectedChat = useAtomValue(selectedChatAtom);
    const selectedChatId = useAtomValue(selectedChatIdAtom);
    const chats = useAtomValue(sortedChatListAtom);
    const chatsLoading = useAtomValue(chatListLoadingAtom);
    const fetchChats = useSetAtom(fetchChatListAtom);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [_, setMobileView] = useState<"list" | "chat">("list");
    
    const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

    const getOtherUserId = (chat: ChatListItem): number => {
		if (chat.type === "direct" && currentUser) {
			return chat.memberIds.find(id => id !== currentUser.id) ?? chat.memberIds[0];
		}
		return chat.memberIds[0];
	};
    // Fetch chats on mount
    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Join socket rooms when chat list changes
    useEffect(() => {
        chats.forEach(chat => {
            socketStore.emit("chat:join", { channelId: chat.channel_id });
        });
    }, [chats]);

    // Handle URL param chatId or "create"
    useEffect(() => {
        if (chatIdParam === "create") {
            setShowCreateModal(true);
        } else if (chatIdParam) {
            const id = Number(chatIdParam);
            if (!isNaN(id)) {
                selectChat(id);
                setMobileView("chat");
            }
        }
    }, [chatIdParam, selectChat]);

    return {
        navigate,
        currentUser,
        blockedUserIds,
        fetchBlockedUsers,
        selectedChat,
        selectedChatId,
        setMobileView,
        formatTime,
        getOtherUserId,
        chats,
        showCreateModal,
        chatsLoading,
        fetchChats
    }
}