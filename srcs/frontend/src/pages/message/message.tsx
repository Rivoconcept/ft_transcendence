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
					{/* <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2">
						<h5 className="mb-0 fw-semibold">Messages</h5>
						<button className="icon-action">
							<MoreVertical size={18} color="#6c757d" />
						</button>
					</div> */}

					{/* Search */}
					<div className="px-3 pb-2">
						<div className="input-group input-group-sm">
							<span className="input-group-text bg-light border-end-0 rounded-start-pill">
								<Search size={14} color="#adb5bd" />
							</span>
							<input
								type="text"
								className="form-control bg-light border-start-0 rounded-end-pill"
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
							<p className="text-center text-muted small mt-4">No conversations found.</p>
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
										<span className="fw-semibold text-truncate" style={{ fontSize: 14 }}>{c.name}</span>
										<span className="text-muted ms-2 flex-shrink-0" style={{ fontSize: 11.5 }}>{c.time}</span>
									</div>
									<div className="d-flex justify-content-between align-items-center mt-1">
										<span
											className="text-truncate"
											style={{
												fontSize: 13,
												color: c.unread > 0 ? "#212529" : "#adb5bd",
												fontWeight: c.unread > 0 ? 500 : 400,
											}}
										>
											{c.lastMessage}
										</span>
										{c.unread > 0 && (
											<span className="badge bg-primary rounded-pill ms-2 flex-shrink-0" style={{ fontSize: 11 }}>
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
						<div className="d-flex align-items-center gap-2 px-3 py-2 bg-white border-bottom shadow-sm">
							<button className="icon-action back-btn" onClick={() => setMobileView("list")}>
								<ArrowLeft size={18} color="#495057" />
							</button>

							<div
								className="msg-avatar flex-shrink-0"
								style={{ background: avatarColors[selected.avatar] || "#6c757d", width: 40, height: 40, fontSize: 13 }}
							>
								{selected.avatar}
							</div>

							<div className="flex-grow-1">
								<div className="fw-semibold" style={{ fontSize: 15 }}>{selected.name}</div>
								<div className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: "#6c757d" }}>
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
								<button className="icon-action"><Phone size={17} color="#6c757d" /></button>
								<button className="icon-action"><Video size={17} color="#6c757d" /></button>
								<button className="icon-action"><MoreVertical size={17} color="#6c757d" /></button>
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
											<small className="text-muted" style={{ fontSize: 11 }}>{msg.time}</small>
											{msg.fromMe && (
												msg.read
													? <CheckCheck size={12} color="#28a745" />
													: <Check size={12} color="#adb5bd" />
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
								<Paperclip size={17} color="#6c757d" />
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
								<Smile size={17} color="#6c757d" />
							</button>

							<button
								className="btn btn-primary d-flex align-items-center justify-content-center p-0 rounded-circle flex-shrink-0"
								style={{ width: 38, height: 38, opacity: input.trim() ? 1 : 0.5 }}
								onClick={sendMessage}
								disabled={!input.trim()}
							>
								<Send size={15} />
							</button>
						</div>
					</>
				) : (
					<div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
						<div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
						<h5 className="mt-3 text-secondary fw-semibold">Select a conversation</h5>
						<p className="text-muted small" style={{ maxWidth: 280 }}>
							Choose from your existing messages on the left to continue a conversation.
						</p>
					</div>
				)}
			</main>
		);
	}

	return (
		<>
			<link
				rel="stylesheet"
			// href=""
			/>

			<div className="messages-root">
				<MessagesSidebar />
				<ChatPanel />
			</div>
		</>
	);
}