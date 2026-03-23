import { useState, useRef, useCallback } from "react";
import { useChat } from "./useChat";
import { useSetAtom, useAtomValue } from "jotai";
import { 
    selectedChatMessagesAtom,
    selectChatAtom,
    loadOlderMessagesAtom,
    sendMessageAtom,
    blockedUserIdsAtom,
    fetchBlockedUsersAtom,
    blockUserAtom,
    unblockUserAtom
 } from "../../providers";

export const useChatPanel = () => {
    
    const { currentUser, formatTime, getOtherUserId, selectedChat, selectedChatId } = useChat();
    const messagesState = useAtomValue(selectedChatMessagesAtom);
    const selectChat = useSetAtom(selectChatAtom);
    const loadOlder = useSetAtom(loadOlderMessagesAtom);
    const doSendMessage = useSetAtom(sendMessageAtom);
    const blockedUserIds = useAtomValue(blockedUserIdsAtom);
    const fetchBlockedUsers = useSetAtom(fetchBlockedUsersAtom);
    const doBlockUser = useSetAtom(blockUserAtom);
    const doUnblockUser = useSetAtom(unblockUserAtom);

    const [input, setInput] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isChatBlocked, setIsChatBlocked] = useState(false);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messages = messagesState?.messages ?? [];
	const hasMore = messagesState?.hasMore ?? false;
	const isLoading = messagesState?.loading ?? false;
	const messagesReady = messagesState !== null && !isLoading;

    const handleSend = useCallback(() => {
        if (!selectedChatId) return;
        if (imagePreview) {
            const caption = input.trim();
            const content = caption ? `${imagePreview}\n${caption}` : imagePreview;
            doSendMessage({ chatId: selectedChatId, content, type: 'image' });
            setImagePreview(null);
            setInput("");
            return;
        }

        if (!input.trim()) return;
        doSendMessage({ chatId: selectedChatId, content: input.trim() });
        setInput("");
    }, [input, selectedChatId, doSendMessage, imagePreview]);

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2Mo
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    const cancelImagePreview = useCallback(() => {
        setImagePreview(null);
        setImageError(null);
    }, []);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setImageError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setImageError("Unsupported format. Use JPEG, PNG, GIF or WebP.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError("Image must not exceed 2 MB.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    return {
        messagesState,
        selectChat,
        loadOlder,
        doSendMessage,
        blockedUserIds,
        fetchBlockedUsers,
        doBlockUser,
        doUnblockUser
    }
}