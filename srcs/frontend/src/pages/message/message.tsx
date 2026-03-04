import { useState, useRef, useEffect } from "react";
import {
	Search,
	Send,
	MoreVertical,
	Phone,
	Video,
	ArrowLeft,
	Check,
	CheckCheck,
	Paperclip,
	Smile,
} from "lucide-react";

interface Message {
	id: number;
	text: string;
	time: string;
	fromMe: boolean;
	read?: boolean;
}

interface Conversation {
	id: number;
	name: string;
	avatar: string;
	lastMessage: string;
	time: string;
	unread: number;
	online: boolean;
	messages: Message[];
}

const conversations: Conversation[] = [
	{
		id: 1,
		name: "friend",
		avatar: "SC",
		lastMessage: "hello world",
		time: "9:41 AM",
		unread: 3,
		online: true,
		messages: [
			{ id: 1, text: "sdfefsef", time: "9:30 AM", fromMe: false },
			{ id: 2, text: "sdfgshfef", time: "9:32 AM", fromMe: true, read: true },
			{ id: 6, text: "hello world", time: "9:41 AM", fromMe: false },
		],
	},
];

const avatarColors: Record<string, string> = {
	SC: "#E57373",
	AR: "#64B5F6",
	DT: "#81C784",
	JP: "#FFB74D",
	PS: "#BA68C8",
};

export default function MessagesPage() {
	const [selected, setSelected] = useState<Conversation | null>(null);
	const [input, setInput] = useState("");
	const [search, setSearch] = useState("");
	const [allConvos, setAllConvos] = useState(conversations);
	const [mobileView, setMobileView] = useState<"list" | "chat">("list");
	const bottomRef = useRef<HTMLDivElement>(null);

	const filtered = allConvos.filter((c) =>
		c.name.toLowerCase().includes(search.toLowerCase())
	);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [selected?.messages]);

	const sendMessage = () => {
		if (!input.trim() || !selected) return;
		const newMsg: Message = {
			id: Date.now(),
			text: input.trim(),
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			fromMe: true,
			read: false,
		};
		const updated = allConvos.map((c) =>
			c.id === selected.id
				? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, time: newMsg.time }
				: c
		);
		setAllConvos(updated);
		setSelected(updated.find((c) => c.id === selected.id) || null);
		setInput("");
	};

	const openConvo = (c: Conversation) => {
		const updated = allConvos.map((conv) =>
			conv.id === c.id ? { ...conv, unread: 0 } : conv
		);
		setAllConvos(updated);
		setSelected(updated.find((conv) => conv.id === c.id) || null);
		setMobileView("chat");
	};

	function MessagesSidebar() {
		return (
			<>
				{/* ── Sidebar ── */}
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
								placeholder="Search conversations…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								style={{ fontSize: 13.5, boxShadow: "none" }}
							/>
						</div>
					</div>

					{/* List */}
					<div className="overflow-auto flex-grow-1">
						{filtered.length === 0 && (
							<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>No conversations found.</p>
						)}
						{filtered.map((c) => (
							<div
								key={c.id}
								className={`convo-item d-flex align-items-center gap-2 px-3 py-2${selected?.id === c.id ? " active" : ""}`}
								onClick={() => openConvo(c)}
							>
								<div className="position-relative flex-shrink-0">
									<div className="msg-avatar" style={{ background: avatarColors[c.avatar] || "#6c757d" }}>
										{c.avatar}
									</div>
									{c.online && <span className="online-dot" />}
								</div>

								<div className="flex-grow-1 overflow-hidden">
									<div className="d-flex justify-content-between align-items-center">
										<span className="fw-semibold text-truncate" style={{ fontSize: 14, color: "var(--text-primary)" }}>{c.name}</span>
										<span className="ms-2 flex-shrink-0" style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{c.time}</span>
									</div>
									<div className="d-flex justify-content-between align-items-center mt-1">
										<span
											className="text-truncate"
											style={{
												fontSize: 13,
												color: c.unread > 0 ? "var(--text-primary)" : "var(--text-secondary)",
												fontWeight: c.unread > 0 ? 500 : 400,
											}}
										>
											{c.lastMessage}
										</span>
										{c.unread > 0 && (
											<span className="unread-badge ms-2 flex-shrink-0">
												{c.unread}
											</span>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</aside>
			</>
		)
	}

	function ChatPanel() {
		return (
			<main className="msg-chat-panel">
				{selected ? (
					<>
						{/* Header */}
						<div className="msg-chat-header d-flex align-items-center gap-2 px-3 py-2">
							<button className="icon-action back-btn" onClick={() => setMobileView("list")}>
								<ArrowLeft size={18} className="icon-themed" />
							</button>

							<div
								className="msg-avatar flex-shrink-0"
								style={{ background: avatarColors[selected.avatar] || "#6c757d", width: 40, height: 40, fontSize: 13 }}
							>
								{selected.avatar}
							</div>

							<div className="flex-grow-1">
								<div className="fw-semibold" style={{ fontSize: 15, color: "var(--text-primary)" }}>{selected.name}</div>
								<div className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
									{selected.online ? (
										<>
											<span
												style={{ width: 7, height: 7, borderRadius: "50%", background: "#28a745", display: "inline-block" }}
											/>
											Active now
										</>
									) : "Offline"}
								</div>
							</div>

							<div className="d-flex gap-1">
								<button className="icon-action"><Phone size={17} className="icon-themed" /></button>
								<button className="icon-action"><Video size={17} className="icon-themed" /></button>
								<button className="icon-action"><MoreVertical size={17} className="icon-themed" /></button>
							</div>
						</div>

						{/* Messages */}
						<div className="msg-area">
							<div className="date-divider">Today</div>

							{selected.messages.map((msg) => (
								<div
									key={msg.id}
									className={`d-flex mb-2 ${msg.fromMe ? "justify-content-end" : "justify-content-start"}`}
								>
									{!msg.fromMe && (
										<div
											className="msg-avatar flex-shrink-0 me-2 align-self-end"
											style={{ background: avatarColors[selected.avatar] || "#6c757d", width: 30, height: 30, fontSize: 10 }}
										>
											{selected.avatar}
										</div>
									)}

									<div>
										<div className={`bubble ${msg.fromMe ? "bubble-me" : "bubble-them"}`}>
											{msg.text}
										</div>
										<div
											className={`d-flex align-items-center mt-1 gap-1 ${msg.fromMe ? "justify-content-end" : "justify-content-start"}`}
										>
											<small style={{ fontSize: 11, color: "var(--text-secondary)" }}>{msg.time}</small>
											{msg.fromMe && (
												msg.read
													? <CheckCheck size={12} color="#28a745" />
													: <Check size={12} style={{ color: "var(--text-secondary)" }} />
											)}
										</div>
									</div>
								</div>
							))}
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
								placeholder="Type a message…"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
								}}
							/>

							<button className="icon-action">
								<Smile size={17} className="icon-themed" />
							</button>

							<button
								className="send-btn-custom"
								onClick={sendMessage}
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
		<>
			<div className="messages-root">
				<MessagesSidebar />
				<ChatPanel />
			</div>
		</>
	);
}
