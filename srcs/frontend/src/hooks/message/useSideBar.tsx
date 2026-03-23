import type { ChatListItem } from "../../models";
import { useState, useCallback } from "react";
import { Image } from "lucide-react";
import { useChat } from "./useChat"
import { useSetAtom, useAtomValue } from "jotai"
import {
    sortedChatListAtom,
    chatListLoadingAtom,
    fetchChatListAtom
} from "../../providers"

export const useSideBar = () => {
    
    const { navigate, setMobileView} = useChat();

    const chats = useAtomValue(sortedChatListAtom);
    const chatsLoading = useAtomValue(chatListLoadingAtom);
    const fetchChats = useSetAtom(fetchChatListAtom);

    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const filtered = chats.filter(c => {
		if (!search.trim()) return true;
		const name = c.name ?? "";
		return name.toLowerCase().includes(search.toLowerCase());
	});

	const handleSelectChat = useCallback((chatId: number) => {
		navigate(`/messages/${chatId}`);
		setMobileView("chat");
	}, [navigate]);

	const getLastMessagePreview = (chat: ChatListItem): React.ReactNode => {
		if (chat.lastMessageType === "image") {
			return (<span className="d-flex align-items-center gap-1">
                <Image size={13} />
                 Image
                </span>);
		}
		return chat.lastMessageContent ?? "";
	};

    return {
        chats,
        chatsLoading,
        fetchChats,
        search,
        setSearch,
        showCreateModal,
        setShowCreateModal,
        filtered,
        handleSelectChat,
        getLastMessagePreview
    }
}