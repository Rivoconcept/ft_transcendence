import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import {
	Search,
	Send,
	MoreVertical,
	ArrowLeft,
	Paperclip,
	Smile,
	Plus,
	X,
	Image,
	ShieldBan,
	ShieldCheck,
} from "lucide-react";
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
	userFamily,
	blockedUserIdsAtom,
	fetchBlockedUsersAtom,
	blockUserAtom,
	unblockUserAtom,
} from "../../providers";
import { socketStore } from "../../store/socketStore";
import AvatarUtil from "../../components/AvatarUtil";
import CreateChatModal from "./CreateChatModal";
import MessageBubble from "./MessageBubble";
import type { ChatListItem } from "../../models";
import "./message.css";

// Small component to resolve a user's display name from cache/API
function UserName({ userId, fallback = "Chat" }: { userId: number; fallback?: string }) {
	const userLoadable = useAtomValue(userFamily(userId));
	if (userLoadable.state === "hasData" && userLoadable.data) {
		return <>{userLoadable.data.username}</>;
	}
	return <>{fallback}</>;
}

// Avatar for group chats — shows initials from group name
function GroupAvatar({ name, size }: { name: string; size: number }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(w => w[0].toUpperCase())
		.join("");
	return (
		<div className="avatar-container" style={{ height: size, width: size }}>
			<div className="avatar" style={{ height: size, width: size, fontSize: size * 0.35 }}>
				{initials || "G"}
			</div>
		</div>
	);
}

// Renders the appropriate avatar based on chat type
function ChatAvatar({ chat, size, currentUserId }: { chat: ChatListItem; size: number; currentUserId?: number }) {
	if (chat.type === "group") {
		return <GroupAvatar name={chat.name ?? "Group"} size={size} />;
	}
	const otherUserId = currentUserId
		? (chat.memberIds.find(id => id !== currentUserId) ?? chat.memberIds[0])
		: chat.memberIds[0];
	return <AvatarUtil id={otherUserId} radius={size} />;
}

export default function MessagesPage() {
	const { chatId: chatIdParam } = useParams<{ chatId?: string }>();
	const navigate = useNavigate();

	const currentUser = useAtomValue(currentUserAtom);
	const chats = useAtomValue(sortedChatListAtom);
	const chatsLoading = useAtomValue(chatListLoadingAtom);
	const fetchChats = useSetAtom(fetchChatListAtom);
	const selectedChat = useAtomValue(selectedChatAtom);
	const selectedChatId = useAtomValue(selectedChatIdAtom);
	const messagesState = useAtomValue(selectedChatMessagesAtom);
	const selectChat = useSetAtom(selectChatAtom);
	const loadOlder = useSetAtom(loadOlderMessagesAtom);
	const doSendMessage = useSetAtom(sendMessageAtom);
	const blockedUserIds = useAtomValue(blockedUserIdsAtom);
	const fetchBlockedUsers = useSetAtom(fetchBlockedUsersAtom);
	const doBlockUser = useSetAtom(blockUserAtom);
	const doUnblockUser = useSetAtom(unblockUserAtom);

	const [input, setInput] = useState("");
	const [search, setSearch] = useState("");
	const [mobileView, setMobileView] = useState<"list" | "chat">("list");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);
	const [showDropdown, setShowDropdown] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const topSentinelRef = useRef<HTMLDivElement>(null);
	const prevScrollHeightRef = useRef<number>(0);
	const isInitialLoadRef = useRef<boolean>(true);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const messages = messagesState?.messages ?? [];
	const hasMore = messagesState?.hasMore ?? false;
	const isLoading = messagesState?.loading ?? false;

	// Close dropdown on outside click
	useEffect(() => {
		if (!showDropdown) return;
		const handleClick = () => setShowDropdown(false);
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [showDropdown]);

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
			if (!isNaN(id) && id !== selectedChatId) {
				selectChat(id);
				setMobileView("chat");
			}
		}
	}, [chatIdParam, selectChat, selectedChatId]);

	// Scroll to bottom on initial load
	useEffect(() => {
		if (isInitialLoadRef.current && messages.length > 0 && !isLoading) {
			bottomRef.current?.scrollIntoView();
			isInitialLoadRef.current = false;
		}
	}, [messages.length, isLoading]);

	// Reset initial load flag and load blocked users when chat changes
	useEffect(() => {
		isInitialLoadRef.current = true;
		if (selectedChatId) {
			fetchBlockedUsers();
		}
		setShowDropdown(false);
	}, [selectedChatId, fetchBlockedUsers]);

	// Scroll to bottom when current user sends a message
	useEffect(() => {
		if (messages.length > 0) {
			const lastMsg = messages[messages.length - 1];
			if (lastMsg.authorId === currentUser?.id || lastMsg.id < 0) {
				bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			}
		}
	}, [messages.length, currentUser?.id]);

	// Preserve scroll position after prepending older messages
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container || isInitialLoadRef.current) return;

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

	const handleSelectChat = useCallback((chatId: number) => {
		selectChat(chatId);
		navigate(`/messages/${chatId}`);
		setMobileView("chat");
	}, [selectChat, navigate]);

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

	const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setImageError(null);
		const file = e.target.files?.[0];
		if (!file) return;

		if (!ALLOWED_TYPES.includes(file.type)) {
			setImageError("Format non supporté. Utilisez JPEG, PNG, GIF ou WebP.");
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (file.size > MAX_IMAGE_SIZE) {
			setImageError("L'image ne doit pas dépasser 2 Mo.");
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

	const cancelImagePreview = useCallback(() => {
		setImagePreview(null);
		setImageError(null);
	}, []);

	const handleBlockUser = useCallback(async (userId: number) => {
		try {
			await doBlockUser(userId);
			setShowDropdown(false);
		} catch { /* silently fail */ }
	}, [doBlockUser]);

	const handleUnblockUser = useCallback(async (userId: number) => {
		try {
			await doUnblockUser(userId);
			setShowDropdown(false);
		} catch { /* silently fail */ }
	}, [doUnblockUser]);

	const getOtherUserId = (chat: ChatListItem): number => {
		if (chat.type === "direct" && currentUser) {
			return chat.memberIds.find(id => id !== currentUser.id) ?? chat.memberIds[0];
		}
		return chat.memberIds[0];
	};

	const getChatDisplayName = (chat: ChatListItem): React.ReactNode => {
		if (chat.name) return chat.name;
		if (chat.type === "direct") {
			const otherUserId = getOtherUserId(chat);
			return <UserName userId={otherUserId} />;
		}
		return "Chat";
	};

	const filtered = chats.filter(c => {
		if (!search.trim()) return true;
		const name = c.name ?? "";
		return name.toLowerCase().includes(search.toLowerCase());
	});

	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	const getLastMessagePreview = (chat: ChatListItem): React.ReactNode => {
		if (chat.lastMessageType === "image") {
			return <span className="d-flex align-items-center gap-1"><Image size={13} /> Image</span>;
		}
		return chat.lastMessageContent ?? "";
	};

	return (
		<div className="messages-root">
			{/* Sidebar */}
			<aside className="msg-sidebar">
				<div className="px-3 pb-2 search-wrapper d-flex align-items-center gap-2">
					<div className="input-group input-group-sm flex-grow-1">
						<span className="input-group-text border-end-0 rounded-start-pill">
							<Search size={14} className="icon-themed" />
						</span>
						<input
							type="text"
							className="form-control border-start-0 rounded-end-pill"
							placeholder="Search conversations..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{ fontSize: 13.5, boxShadow: "none" }}
						/>
					</div>
					<button className="icon-action flex-shrink-0" onClick={() => setShowCreateModal(true)} title="New conversation">
						<Plus size={18} className="icon-themed" />
					</button>
				</div>

				<div className="overflow-auto flex-grow-1">
					{chatsLoading && chats.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</p>
					)}
					{!chatsLoading && filtered.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>No conversations found.</p>
					)}
					{filtered.map((c) => {
						return (
							<div
								key={c.id}
								className={`convo-item d-flex align-items-center gap-2 px-3 py-2${selectedChatId === c.id ? " active" : ""}`}
								onClick={() => handleSelectChat(c.id)}
							>
								<div className="position-relative flex-shrink-0">
									<ChatAvatar chat={c} size={44} currentUserId={currentUser?.id} />
								</div>

								<div className="flex-grow-1 overflow-hidden">
									<div className="d-flex justify-content-between align-items-center">
										<span className="fw-semibold text-truncate" style={{ fontSize: 14, color: "var(--text-primary)" }}>
											{getChatDisplayName(c)}
										</span>
										<span className="ms-2 flex-shrink-0" style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
											{formatTime(c.lastMessageDate ?? c.created_at)}
										</span>
									</div>
									<div className="d-flex justify-content-between align-items-center mt-1">
										<span
											className="text-truncate"
											style={{ fontSize: 13, color: "var(--text-secondary)" }}
										>
											{getLastMessagePreview(c)}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</aside>

			{/* Chat Panel */}
			<main className="msg-chat-panel">
				{selectedChat ? (
					<>
						<div className="msg-chat-header d-flex align-items-center gap-2 px-3 py-2">
							<button className="icon-action back-btn" onClick={() => { setMobileView("list"); navigate("/messages"); }}>
								<ArrowLeft size={18} className="icon-themed" />
							</button>

							<div className="flex-shrink-0">
								<ChatAvatar chat={selectedChat} size={40} currentUserId={currentUser?.id} />
							</div>

							<div className="flex-grow-1">
								<div className="fw-semibold" style={{ fontSize: 15, color: "var(--text-primary)" }}>
									{getChatDisplayName(selectedChat)}
								</div>
								<div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
									{selectedChat.type === "group"
										? `${selectedChat.memberIds.length} members`
										: ""}
								</div>
							</div>

							<div className="d-flex gap-1 position-relative">
								<button className="icon-action" onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }}>
									<MoreVertical size={17} className="icon-themed" />
								</button>
								{showDropdown && selectedChat.type === "direct" && (() => {
									const otherUserId = getOtherUserId(selectedChat);
									const isOtherBlocked = blockedUserIds.has(otherUserId);
									return (
										<div className="chat-dropdown-menu">
											{isOtherBlocked ? (
												<button className="chat-dropdown-item" onClick={() => handleUnblockUser(otherUserId)}>
													<ShieldCheck size={15} /> Débloquer
												</button>
											) : (
												<button className="chat-dropdown-item danger" onClick={() => handleBlockUser(otherUserId)}>
													<ShieldBan size={15} /> Bloquer
												</button>
											)}
										</div>
									);
								})()}
							</div>
						</div>

						<div className="msg-area" ref={scrollContainerRef}>
							<div ref={topSentinelRef} style={{ height: 1 }} />

							{isLoading && messages.length > 0 && (
								<div className="text-center py-2">
									<small style={{ color: "var(--text-secondary)" }}>Loading older messages...</small>
								</div>
							)}

							{isLoading && messages.length === 0 && (
								<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
									<small style={{ color: "var(--text-secondary)" }}>Loading messages...</small>
								</div>
							)}

							{messages.map((msg) => {
								const fromMe = msg.authorId === currentUser?.id || msg.id < 0;
								const isMessageBlocked = !fromMe && blockedUserIds.has(msg.authorId);
								return (
									<MessageBubble
										key={msg.id}
										message={msg}
										fromMe={fromMe}
										formatTime={formatTime}
										isBlocked={isMessageBlocked}
									/>
								);
							})}
							<div ref={bottomRef} />
						</div>

						{imagePreview && (
							<div className="image-preview-bar">
								<img src={imagePreview} alt="preview" className="image-preview-thumb" />
								<span className="image-preview-label" style={{ color: "var(--text-secondary)", fontSize: 13 }}>Image ready to send</span>
								<button className="icon-action" onClick={cancelImagePreview} title="Cancel">
									<X size={16} className="icon-themed" />
								</button>
							</div>
						)}

						{imageError && (
							<div className="image-error-bar">
								<small>{imageError}</small>
								<button className="icon-action" onClick={() => setImageError(null)}>
									<X size={14} className="icon-themed" />
								</button>
							</div>
						)}

						<div className="msg-input-area">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/png,image/gif,image/webp"
								hidden
								onChange={handleImageSelect}
							/>
							<button className="icon-action" onClick={() => fileInputRef.current?.click()} title="Send image">
								<Paperclip size={17} className="icon-themed" />
							</button>

							<textarea
								className="msg-textarea"
								rows={1}
								placeholder="Type a message..."
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
								}}
							/>

							<button className="icon-action">
								<Smile size={17} className="icon-themed" />
							</button>

							<button
								className="send-btn-custom"
								onClick={handleSend}
								disabled={!input.trim() && !imagePreview}
							>
								<Send size={20} />
							</button>
						</div>
					</>
				) : (
					<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
						<div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
						<h5 className="mt-3 fw-semibold" style={{ color: "var(--text-secondary)" }}>Select a conversation</h5>
						<p className="small" style={{ maxWidth: 280, color: "var(--text-secondary)" }}>
							Choose from your existing messages on the left to continue a conversation.
						</p>
					</div>
				)}
			</main>

			{showCreateModal && (
				<CreateChatModal onClose={() => {
					setShowCreateModal(false);
					if (chatIdParam === "create") navigate("/messages");
				}} />
			)}
		</div>
	);
}
