import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import {
	Search,
	Send,
	MoreVertical,
	ArrowLeft,
	Paperclip,
	Plus,
	X,
	Image,
	ShieldBan,
	ShieldCheck,
	Users,
	LogOut,
	UserRound,
	Link2,
} from "lucide-react";
import Swal from "sweetalert2";
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
	markAsReadAtom,
	userFamily,
	blockedUserIdsAtom,
	fetchBlockedUsersAtom,
	blockUserAtom,
	unblockUserAtom,
} from "../../providers";
import { socketStore } from "../../store/socketStore";
import { blockService } from "../../services/block.service";
import { chatService } from "../../services/chat.service";
import AvatarUtil from "../../components/AvatarUtil";
import CreateChatModal from "./CreateChatModal";
import MessageBubble from "../../components/message/MessageBubble";
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
function ChatAvatar({ chat, size, currentUserId, showStatus }: { chat: ChatListItem; size: number; currentUserId?: number; showStatus?: boolean }) {
	if (chat.type === "group") {
		return <GroupAvatar name={chat.name ?? "Group"} size={size} />;
	}
	const otherUserId = currentUserId
		? (chat.memberIds.find(id => id !== currentUserId) ?? chat.memberIds[0])
		: chat.memberIds[0];
	return <AvatarUtil id={otherUserId} radius={size} showStatus={showStatus} />;
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
	const doMarkAsRead = useSetAtom(markAsReadAtom);

	const [input, setInput] = useState("");
	const [search, setSearch] = useState("");
	const [mobileView, setMobileView] = useState<"list" | "chat">("list");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);
	const [showDropdown, setShowDropdown] = useState(false);
	const [isChatBlocked, setIsChatBlocked] = useState(false);
	const [showMembersModal, setShowMembersModal] = useState(false);
	const [nonMemberChat, setNonMemberChat] = useState<ChatListItem | null>(null);
	const [joiningGroup, setJoiningGroup] = useState(false);

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
		setNonMemberChat(null);
		if (chatIdParam === "create") {
			setShowCreateModal(true);
		} else if (chatIdParam) {
			const id = Number(chatIdParam);
			if (!isNaN(id)) {
				// Check if we're a member
				const isMember = chats.some(c => c.id === id);
				if (isMember) {
					selectChat(id);
					setMobileView("chat");
				} else if (!chatsLoading) {
					// Not a member — fetch chat info to show join button
					chatService.getChatById(id).then(chat => {
						if (chat && chat.type === "group") {
							setNonMemberChat(chat);
							setMobileView("chat");
						}
					}).catch(() => {});
				}
			}
		}
	}, [chatIdParam, selectChat, chats, chatsLoading]);

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
				}).catch(() => { });
			}
		}
		setShowDropdown(false);
	}, [selectedChatId, fetchBlockedUsers, selectedChat, currentUser]);

	// Auto-mark messages as read when viewing a chat
	const lastReadMarkedRef = useRef<number | null>(null);
	useEffect(() => {
		lastReadMarkedRef.current = null;
	}, [selectedChatId]);

	const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
	useEffect(() => {
		if (!selectedChatId || !messagesReady || lastMessageId === null || lastMessageId < 0) return;
		if (lastReadMarkedRef.current === lastMessageId) return;
		if (currentUser) {
			lastReadMarkedRef.current = lastMessageId;
			doMarkAsRead({ chatId: selectedChatId, messageId: lastMessageId });
		}
	}, [selectedChatId, messagesReady, lastMessageId, currentUser, doMarkAsRead]);

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

	const handleSelectChat = useCallback((chatId: number) => {
		navigate(`/messages/${chatId}`);
		setMobileView("chat");
	}, [navigate]);

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

	const processImageFile = useCallback((file: File) => {
		setImageError(null);

		if (!ALLOWED_TYPES.includes(file.type)) {
			setImageError("Unsupported format. Use JPEG, PNG, GIF or WebP.");
			return;
		}

		if (file.size > MAX_IMAGE_SIZE) {
			setImageError("Image must not exceed 2 MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	}, []);

	const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		processImageFile(file);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [processImageFile]);

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of items) {
			if (item.type.startsWith("image/")) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) processImageFile(file);
				return;
			}
		}
	}, [processImageFile]);

	const cancelImagePreview = useCallback(() => {
		setImagePreview(null);
		setImageError(null);
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

	const handleLeaveGroup = useCallback(async () => {
		if (!selectedChatId) return;
		if (!window.confirm('Are you sure you want to leave this group?')) return;
		try {
			await chatService.leaveGroup(selectedChatId);
			navigate('/messages');
			window.location.reload();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to leave group';
			Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: msg, showConfirmButton: false, timer: 3000 });
		}
	}, [selectedChatId, navigate]);

	const handleToggleModerator = useCallback(async (targetUserId: number) => {
		if (!selectedChatId) return;
		try {
			await chatService.toggleModerator(selectedChatId, targetUserId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to change moderator status';
			Swal.fire({ icon: 'warning', title: 'Cannot change', text: msg });
		}
	}, [selectedChatId]);

	const handleKickMember = useCallback(async (targetUserId: number) => {
		if (!selectedChatId) return;
		if (!window.confirm('Are you sure you want to kick this member?')) return;
		try {
			await chatService.kickMember(selectedChatId, targetUserId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to kick member';
			Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: msg, showConfirmButton: false, timer: 3000 });
		}
	}, [selectedChatId]);

	const handleJoinGroup = useCallback(async () => {
		if (!nonMemberChat) return;
		setJoiningGroup(true);
		try {
			await chatService.joinGroup(nonMemberChat.channel_id);
			window.location.reload();
		} catch (err) {
			Swal.fire({ icon: 'error', title: 'Cannot join', text: err instanceof Error ? err.message : 'Failed to join group' });
			setJoiningGroup(false);
		}
	}, [nonMemberChat]);

	const handleCopyInviteLink = useCallback(() => {
		if (!selectedChat) return;
		const link = `${window.location.origin}/messages/${selectedChat.id}`;
		navigator.clipboard.writeText(link);
		Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Invite link copied!', showConfirmButton: false, timer: 2000 });
	}, [selectedChat]);

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
		<div className={`messages-root${mobileView === "chat" ? " mobile-chat" : ""}`}>
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
						<p className="text-center small mt-4" style={{ color: "var(--app-text-secondary)" }}>Loading...</p>
					)}
					{!chatsLoading && filtered.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--app-text-secondary)" }}>No conversations found.</p>
					)}
					{filtered.map((c) => {
						return (
							<div
								key={c.id}
								className={`convo-item d-flex align-items-center gap-2 px-3 py-2${selectedChatId === c.id ? " active" : ""}`}
								onClick={() => handleSelectChat(c.id)}
							>
								<div className="position-relative flex-shrink-0">
									<ChatAvatar chat={c} size={44} currentUserId={currentUser?.id} showStatus={true} />
								</div>

								<div className="flex-grow-1 overflow-hidden">
									<div className="d-flex justify-content-between align-items-center">
										<span className="fw-semibold text-truncate" style={{ fontSize: 14, color: "var(--app-text-primary)" }}>
											{getChatDisplayName(c)}
										</span>
										<span className="ms-2 flex-shrink-0" style={{ fontSize: 11.5, color: "var(--app-text-secondary)" }}>
											{formatTime(c.lastMessageDate ?? c.created_at)}
										</span>
									</div>
									<div className="d-flex justify-content-between align-items-center mt-1">
										<span
											className="text-truncate"
											style={{ fontSize: 13, color: "var(--app-text-secondary)" }}
										>
											{getLastMessagePreview(c)}
										</span>
										{c.unreadCount > 0 && (
											<span className="badge rounded-pill bg-primary ms-2 flex-shrink-0" style={{ fontSize: 11, minWidth: 20 }}>
												{c.unreadCount}
											</span>
										)}
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
								<ChatAvatar chat={selectedChat} size={40} currentUserId={currentUser?.id} showStatus={false} />
							</div>

							<div className="flex-grow-1">
								<div className="fw-semibold" style={{ fontSize: 15, color: "var(--app-text-primary)" }}>
									{getChatDisplayName(selectedChat)}
								</div>
								<div style={{ fontSize: 12, color: "var(--app-text-secondary)" }}>
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
													<ShieldCheck size={15} /> Unblock
												</button>
											) : (
												<button className="chat-dropdown-item danger" onClick={() => handleBlockUser(otherUserId)}>
													<ShieldBan size={15} /> Block
												</button>
											)}
										</div>
									);
								})()}
								{showDropdown && selectedChat.type === "group" && (
									<div className="chat-dropdown-menu">
										<button className="chat-dropdown-item" onClick={() => { setShowMembersModal(true); setShowDropdown(false); }}>
											<Users size={15} /> Members
										</button>
										<button className="chat-dropdown-item" onClick={() => { handleCopyInviteLink(); setShowDropdown(false); }}>
											<Link2 size={15} /> Copy invite link
										</button>
										<button className="chat-dropdown-item danger" onClick={() => { handleLeaveGroup(); setShowDropdown(false); }}>
											<LogOut size={15} /> Leave group
										</button>
									</div>
								)}
							</div>
						</div>

						<div className="msg-area" ref={scrollContainerRef} key={selectedChatId}>
							<div ref={topSentinelRef} style={{ height: 1 }} />

							{isLoading && messages.length > 0 && (
								<div className="text-center py-2">
									<small style={{ color: "var(--app-text-secondary)" }}>Loading older messages...</small>
								</div>
							)}

							{isLoading && messages.length === 0 && (
								<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
									<small style={{ color: "var(--app-text-secondary)" }}>Loading messages...</small>
								</div>
							)}

							{messages.map((msg) => {
								const fromMe = msg.authorId === currentUser?.id || msg.id < 0;
								const isMessageBlocked = !fromMe && blockedUserIds.has(msg.authorId);
								const iAmMod = selectedChat?.type === "group" && currentUser
									? selectedChat.moderatorIds.includes(currentUser.id) : false;
								const canDeleteMsg = !msg.deleted && (fromMe || iAmMod);
								return (
									<MessageBubble
										key={msg.id}
										message={msg}
										fromMe={fromMe}
										formatTime={formatTime}
										isBlocked={isMessageBlocked}
										currentUserId={currentUser?.id}
										canDelete={canDeleteMsg}
										onDelete={async (messageId) => {
											try {
												await chatService.deleteMessage(messageId);
											} catch { /* socket will update */ }
										}}
									/>
								);
							})}
							<div ref={bottomRef} />
						</div>

						{imagePreview && (
							<div className="image-preview-bar">
								<img src={imagePreview} alt="preview" className="image-preview-thumb" />
								<span className="image-preview-label" style={{ color: "var(--app-text-secondary)", fontSize: 13 }}>Image ready to send</span>
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

						{isChatBlocked ? (
							<div className="msg-input-area" style={{ justifyContent: "center" }}>
								<span style={{ color: "var(--app-text-secondary)", fontStyle: "italic", fontSize: 14 }}>
									You cannot send messages to this person
								</span>
							</div>
						) : (
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
									onPaste={handlePaste}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
									}}
								/>

								<button
									className="send-btn-custom"
									onClick={handleSend}
									disabled={!input.trim() && !imagePreview}
								>
									<Send size={20} />
								</button>
							</div>
						)}
					</>
				) : nonMemberChat ? (
					<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
						<Users size={48} style={{ color: "var(--primary-color)", marginBottom: 16 }} />
						<h5 className="fw-semibold" style={{ color: "var(--app-text-primary)" }}>
							{nonMemberChat.name}
						</h5>
						<p style={{ color: "var(--app-text-secondary)", fontSize: 14, marginBottom: 24 }}>
							{nonMemberChat.memberIds.length} members
						</p>
						<button
							className="btn-primary"
							onClick={handleJoinGroup}
							disabled={joiningGroup}
							style={{ padding: "0.6rem 2rem", borderRadius: 8, fontWeight: 600 }}
						>
							{joiningGroup ? "Joining..." : "Join the group chat"}
						</button>
					</div>
				) : (
					<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
						<div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
						<h5 className="mt-3 fw-semibold" style={{ color: "var(--app-text-secondary)" }}>Select a conversation</h5>
						<p className="small" style={{ maxWidth: 280, color: "var(--app-text-secondary)" }}>
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

			{showMembersModal && selectedChat?.type === "group" && (
				<div
					className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
					style={{ zIndex: 1060, background: "rgba(0,0,0,0.4)" }}
					onClick={() => setShowMembersModal(false)}
				>
					<div
						className="rounded-3 shadow"
						style={{
							background: "var(--bg-surface)",
							border: "1px solid var(--border-color)",
							minWidth: 240,
							maxWidth: 320,
							maxHeight: "50vh",
							overflow: "hidden",
						}}
						onClick={e => e.stopPropagation()}
					>
						<div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
							<span className="fw-semibold" style={{ fontSize: 15, color: "var(--app-text-primary)" }}>
								Members ({selectedChat.memberIds.length})
							</span>
							<button
								className="btn btn-sm p-0 border-0"
								onClick={() => setShowMembersModal(false)}
								style={{ lineHeight: 1 }}
							>
								<X size={18} style={{ color: "var(--app-text-secondary)" }} />
							</button>
						</div>
						<div style={{ overflowY: "auto", maxHeight: "calc(50vh - 45px)" }}>
							{[...selectedChat.memberIds].sort((a, b) => {
							if (a === currentUser?.id) return -1;
							if (b === currentUser?.id) return 1;
							return 0;
						}).map(uid => {
								const isMod = selectedChat.moderatorIds.includes(uid);
								const iAmMod = currentUser ? selectedChat.moderatorIds.includes(currentUser.id) : false;
								return (
									<div key={uid} className="d-flex align-items-center gap-2 px-3 py-2">
										<AvatarUtil id={uid} radius={32} showStatus={true} />
										<div className="flex-grow-1">
											<span style={{ fontSize: 14, color: "var(--app-text-primary)" }}>
												<UserName userId={uid} />
												{uid === currentUser?.id && <span style={{ color: "var(--app-text-secondary)" }}> (You)</span>}
											</span>
										</div>
										{iAmMod && uid !== currentUser?.id ? (
											<>
												<div
													onClick={() => handleToggleModerator(uid)}
													title={isMod ? "Remove moderator" : "Make moderator"}
													style={{
														width: 40, height: 22, borderRadius: 11, cursor: "pointer",
														background: isMod ? "#ef4444" : "#6c757d",
														position: "relative", transition: "background 0.2s",
													}}
												>
													<div style={{
														position: "absolute", top: 2,
														left: isMod ? 20 : 2,
														width: 18, height: 18, borderRadius: "50%",
														background: "#fff", transition: "left 0.2s",
														display: "flex", alignItems: "center", justifyContent: "center",
													}}>
														<UserRound size={12} style={{ color: isMod ? "#ef4444" : "#6c757d" }} />
													</div>
												</div>
												<button
													className="btn btn-sm p-0 border-0"
													onClick={() => handleKickMember(uid)}
													title="Kick member"
													style={{ lineHeight: 1 }}
												>
													<LogOut size={16} style={{ color: "#ef4444" }} />
												</button>
											</>
										) : (
											<UserRound size={18} style={{ color: isMod ? "#ef4444" : "#6c757d" }} />
										)}
									</div>
								);
							})}
						</div>
						<div className="px-3 py-2 border-top">
							<button
								className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
								onClick={() => { setShowMembersModal(false); handleLeaveGroup(); }}
								style={{ color: "#ef4444", background: "transparent", border: "none", fontSize: 14 }}
							>
								<LogOut size={15} /> Leave group
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
