import { useChat } from "./useChat";
import { useSetAtom, useAtomValue } from "jotai";
import { blockService } from "../../services/block.service";
import {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback
} from "react";
import { 
    selectedChatMessagesAtom,
    loadOlderMessagesAtom,
    sendMessageAtom,
    blockedUserIdsAtom,
    blockUserAtom,
    unblockUserAtom,
 } from "../../providers";

export const useChatPanel = () => {

    const { currentUser, selectedChat, selectedChatId, fetchBlockedUsers } = useChat();

    const messagesState = useAtomValue(selectedChatMessagesAtom);
    const loadOlder = useSetAtom(loadOlderMessagesAtom);
    const doSendMessage = useSetAtom(sendMessageAtom);
    const blockedUserIds = useAtomValue(blockedUserIdsAtom);
    const doBlockUser = useSetAtom(blockUserAtom);
    const doUnblockUser = useSetAtom(unblockUserAtom);
    const [input, setInput] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isChatBlocked, setIsChatBlocked] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messages = messagesState?.messages ?? [];
	const hasMore = messagesState?.hasMore ?? false;
	const isLoading = messagesState?.loading ?? false;
	const messagesReady = messagesState !== null && !isLoading;


    // Close dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return;
        const handleClick = () => setShowDropdown(false);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [showDropdown]);

    // Scroll to bottom when messages become ready (initial load)
    const hasScrolledRef = useRef(false);
    useLayoutEffect(() => {
        hasScrolledRef.current = false;
    }, [selectedChatId]);

    useLayoutEffect(() => {
        if (messagesReady && !hasScrolledRef.current && messages.length > 0) {
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
            hasScrolledRef.current = true;
        }
    }, [messagesReady, messages.length]);

    // Load blocked users when chat changes
    useEffect(() => {
        setIsChatBlocked(false);
        if (selectedChatId) {
            fetchBlockedUsers();
            if (selectedChat?.type === "direct" && currentUser) {
                const otherUserId = selectedChat.memberIds.find(id => id !== currentUser.id) ?? selectedChat.memberIds[0];
                blockService.isBlockedMutual(otherUserId).then(({ blocked }) => {
                    setIsChatBlocked(blocked);
                }).catch(() => {});
            }
        }
        setShowDropdown(false);
    }, [selectedChatId, fetchBlockedUsers, selectedChat, currentUser]);

    // Scroll to bottom when current user sends a message
    useEffect(() => {
        if (!hasScrolledRef.current) return;
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.authorId === currentUser?.id || lastMsg.id < 0) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [messages.length, currentUser?.id]);

    // Preserve scroll position after prepending older messages
    useLayoutEffect(() => {
        if (!hasScrolledRef.current) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const newScrollHeight = container.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        if (diff > 0 && prevScrollHeightRef.current > 0) {
            container.scrollTop = diff;
        }
    }, [messages.length]);

    // IntersectionObserver for scroll-up pagination
    useEffect(() => {
        const sentinel = topSentinelRef.current;
        const container = scrollContainerRef.current;
        if (!sentinel || !container || !selectedChatId) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    prevScrollHeightRef.current = container.scrollHeight;
                    loadOlder(selectedChatId);
                }
            },
            {
                root: container,
                rootMargin: "100px 0px 0px 0px",
                threshold: 0,
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [selectedChatId, hasMore, isLoading, loadOlder]);

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

	const handleBlockUser = useCallback(async (userId: number) => {
		if (!window.confirm('Are you sure you want to block this user?')) return;
		try {
			await doBlockUser(userId);
			setIsChatBlocked(true);
			setShowDropdown(false);
		} catch { /* silently fail */ }
	}, [doBlockUser]);

	const handleUnblockUser = useCallback(async (userId: number) => {
		try {
			await doUnblockUser(userId);
			setIsChatBlocked(false);
			setShowDropdown(false);
		} catch { /* silently fail */ }
	}, [doUnblockUser]);

    return {
        blockedUserIds,
        fetchBlockedUsers,
        imageError,
        isChatBlocked,
        cancelImagePreview,
        handleSend,
        handleImageSelect,
        handleBlockUser,
        handleUnblockUser
    }
}