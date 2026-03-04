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
} from "../../providers";
import { socketStore } from "../../store/socketStore";
import AvatarUtil from "../../components/AvatarUtil";
import type { ChatListItem } from "../../models";

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

	const [input, setInput] = useState("");
	const [search, setSearch] = useState("");
	const [mobileView, setMobileView] = useState<"list" | "chat">("list");

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const topSentinelRef = useRef<HTMLDivElement>(null);
	const prevScrollHeightRef = useRef<number>(0);
	const isInitialLoadRef = useRef<boolean>(true);

	const messages = messagesState?.messages ?? [];
	const hasMore = messagesState?.hasMore ?? false;
	const isLoading = messagesState?.loading ?? false;

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

	// Handle URL param chatId
	useEffect(() => {
		if (chatIdParam) {
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

	// Reset initial load flag when chat changes
	useEffect(() => {
		isInitialLoadRef.current = true;
	}, [selectedChatId]);

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
		if (!input.trim() || !selectedChatId) return;
		doSendMessage({ chatId: selectedChatId, content: input.trim() });
		setInput("");
	}, [input, selectedChatId, doSendMessage]);

	const getOtherUserId = (chat: ChatListItem): number => {
		if (chat.type === "direct" && currentUser) {
			return chat.memberIds.find(id => id !== currentUser.id) ?? chat.memberIds[0];
		}
		return chat.memberIds[0];
	};

	const getChatDisplayName = (chat: ChatListItem): string => {
		if (chat.name) return chat.name;
		return "Chat";
	};

	const filtered = chats.filter(c => {
		const name = c.name ?? "";
		return name.toLowerCase().includes(search.toLowerCase());
	});

	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	// Get last message text from loaded messages
	const getLastMessagePreview = (_chat: ChatListItem): string => {
		return "...";
	};

	function MessagesSidebar() {
		return (
			<aside className="msg-sidebar">
				{/* Search */}
				<div className="px-3 pb-2 search-wrapper">
					<div className="input-group input-group-sm">
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
				</div>

				{/* List */}
				<div className="overflow-auto flex-grow-1">
					{chatsLoading && chats.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</p>
					)}
					{!chatsLoading && filtered.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>No conversations found.</p>
					)}
					{filtered.map((c) => {
						const otherUserId = getOtherUserId(c);
						return (
							<div
								key={c.id}
								className={`convo-item d-flex align-items-center gap-2 px-3 py-2${selectedChatId === c.id ? " active" : ""}`}
								onClick={() => handleSelectChat(c.id)}
							>
								<div className="position-relative flex-shrink-0">
									<AvatarUtil id={otherUserId} radius={44} />
								</div>

								<div className="flex-grow-1 overflow-hidden">
									<div className="d-flex justify-content-between align-items-center">
										<span className="fw-semibold text-truncate" style={{ fontSize: 14, color: "var(--text-primary)" }}>
											{getChatDisplayName(c)}
										</span>
										<span className="ms-2 flex-shrink-0" style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
											{formatTime(c.created_at)}
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
		);
	}

	function ChatPanel() {
		return (
			<main className="msg-chat-panel">
				{selectedChat ? (
					<>
						{/* Header */}
						<div className="msg-chat-header d-flex align-items-center gap-2 px-3 py-2">
							<button className="icon-action back-btn" onClick={() => { setMobileView("list"); navigate("/messages"); }}>
								<ArrowLeft size={18} className="icon-themed" />
							</button>

							<div className="flex-shrink-0">
								<AvatarUtil id={getOtherUserId(selectedChat)} radius={40} />
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

							<div className="d-flex gap-1">
								<button className="icon-action"><MoreVertical size={17} className="icon-themed" /></button>
							</div>
						</div>

						{/* Messages */}
						<div className="msg-area" ref={scrollContainerRef}>
							{/* Top sentinel for infinite scroll */}
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
								return (
									<div
										key={msg.id}
										className={`d-flex mb-2 ${fromMe ? "justify-content-end" : "justify-content-start"}`}
									>
										{!fromMe && (
											<div className="me-2 align-self-end">
												<AvatarUtil id={msg.authorId} radius={30} showStatus={false} />
											</div>
										)}

										<div>
											<div className={`bubble ${fromMe ? "bubble-me" : "bubble-them"}`}>
												{msg.content}
											</div>
											<div
												className={`d-flex align-items-center mt-1 gap-1 ${fromMe ? "justify-content-end" : "justify-content-start"}`}
											>
												<small style={{ fontSize: 11, color: "var(--text-secondary)" }}>
													{formatTime(msg.created_at)}
												</small>
											</div>
										</div>
									</div>
								);
							})}
							<div ref={bottomRef} />
						</div>

						{/* Input */}
						<div className="msg-input-area">
							<button className="icon-action">
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
								disabled={!input.trim()}
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
		);
	}

	return (
		<div className="messages-root">
			<MessagesSidebar />
			<ChatPanel />
		</div>
	);
}
