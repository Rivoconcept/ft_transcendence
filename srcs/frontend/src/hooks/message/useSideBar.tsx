import type { ChatListItem } from "../../models";
import { useState, useCallback } from "react";
import { Image } from "lucide-react";
import { useChat } from "./useChat"

export const useSideBar = () => {
    
    const { navigate, setMobileView, chats} = useChat();

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
        search,
        setSearch,
        showCreateModal,
        setShowCreateModal,
        filtered,
        handleSelectChat,
        getLastMessagePreview
    }
}