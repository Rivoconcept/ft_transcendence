import { useAtomValue, useSetAtom } from "jotai";
import { 
    currentUserAtom,
    blockedUserIdsAtom,
    fetchBlockedUsersAtom,
    selectedChatAtom,
    selectedChatIdAtom
} from "../../providers";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ChatListItem } from "../../models";

export const useChat = () => {

    const navigate = useNavigate();
    const currentUser = useAtomValue(currentUserAtom);
    const blockedUserIds = useAtomValue(blockedUserIdsAtom);
    const fetchBlockedUsers = useSetAtom(fetchBlockedUsersAtom);
    const selectedChat = useAtomValue(selectedChatAtom);
    const selectedChatId = useAtomValue(selectedChatIdAtom);

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

    return {
        navigate,
        currentUser,
        blockedUserIds,
        fetchBlockedUsers,
        selectedChat,
        selectedChatId,
        setMobileView,
        formatTime,
        getOtherUserId
    }
}