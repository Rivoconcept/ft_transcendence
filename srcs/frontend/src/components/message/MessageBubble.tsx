import React, { useState } from "react";
import { CheckCheck, X, Trash2 } from "lucide-react";
import { useAtomValue } from "jotai";
import AvatarUtil from "../AvatarUtil";
import { userFamily } from "../../providers";
import type { MessageItem } from "../../models";

const URL_REGEX = /(https?:\/\/\S+)/g;

function linkifyText(text: string): React.ReactNode {
	const parts = text.split(URL_REGEX);
	return parts.map((part, i) =>
		URL_REGEX.test(part) ? (
			<a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
				{part}
			</a>
		) : (
			<React.Fragment key={i}>{part}</React.Fragment>
		)
	);
}

interface MessageBubbleProps {
	message: MessageItem;
	fromMe: boolean;
	formatTime: (dateStr: string) => string;
	isBlocked?: boolean;
	currentUserId?: number;
	canDelete?: boolean;
	onDelete?: (messageId: number) => void;
}

function parseImageContent(content: string): { imageUrl: string; caption: string | null } {
	const newlineIndex = content.indexOf("\n");
	if (newlineIndex === -1) {
		return { imageUrl: content, caption: null };
	}
	return {
		imageUrl: content.substring(0, newlineIndex),
		caption: content.substring(newlineIndex + 1).trim() || null,
	};
}

function ReaderRow({ userId }: { userId: number }) {
	const userLoadable = useAtomValue(userFamily(userId));
	const username = userLoadable.state === "hasData" && userLoadable.data
		? userLoadable.data.username
		: "...";

	return (
		<div className="d-flex align-items-center gap-2 px-3 py-2">
			<AvatarUtil id={userId} radius={32} showStatus={false} hasInfo={true} />
			<span style={{ fontSize: 14, color: "var(--app-text-primary)" }}>{username}</span>
		</div>
	);
}

export default function MessageBubble({ message, fromMe, formatTime, isBlocked, canDelete, onDelete }: MessageBubbleProps) {
	const [revealed, setRevealed] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const hidden = isBlocked && !revealed;

	const isImage = message.type === "image";
	const isDeleted = message.deleted;
	const parsed = isImage && !hidden && !isDeleted ? parseImageContent(message.content) : null;
	const imageOnly = isImage && !hidden && !isDeleted && !parsed?.caption;

	// Readers excluding the author (author has always read their own message)
	const readers = message.readBy.filter(id => id !== message.authorId);

	const handleDelete = () => {
		if (!onDelete) return;
		if (!window.confirm('Delete this message?')) return;
		onDelete(message.id);
	};

	return (
		<>
			<div className={`d-flex mb-2 ${fromMe ? "justify-content-end" : "justify-content-start"}`}>
				{!fromMe && (
					<div className="me-2 align-self-end">
						<AvatarUtil id={message.authorId} radius={30} showStatus={false} hasInfo={true} />
					</div>
				)}

				<div>
					<div className={`bubble ${fromMe ? "bubble-me" : "bubble-them"} ${imageOnly ? "bubble-image" : ""} ${isImage && !imageOnly && !hidden && !isDeleted ? "bubble-with-image" : ""}`}>
						{isDeleted ? (
							<span style={{ fontStyle: "italic", opacity: 0.5 }}>This message has been deleted</span>
						) : hidden ? (
							<span className="blocked-content" onClick={() => setRevealed(true)} style={{ cursor: "pointer" }}>Hidden content</span>
						) : isImage && parsed ? (
							<>
								{parsed.caption && (
									<div className="bubble-caption">{parsed.caption}</div>
								)}
								<img src={parsed.imageUrl} alt="image" className="bubble-img" />
							</>
						) : (
							linkifyText(message.content)
						)}
					</div>
					<div
						className={`d-flex align-items-center mt-1 gap-1 ${fromMe ? "justify-content-end" : "justify-content-start"}`}
					>
						<small style={{ fontSize: 11, color: "var(--text-secondary)" }}>
							{formatTime(message.created_at)}
						</small>
						{canDelete && !isDeleted && (
							<Trash2
								size={12}
								style={{ color: "var(--app-text-secondary)", cursor: "pointer", opacity: 0.5 }}
								onClick={handleDelete}
								onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
								onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0.5"; }}
							/>
						)}
						{readers.length > 0 && (
							<CheckCheck
								size={14}
								style={{ color: "var(--bs-primary)", cursor: "pointer" }}
								onClick={() => setShowModal(true)}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Read by modal */}
			{showModal && (
				<div
					className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
					style={{ zIndex: 1060, background: "rgba(0,0,0,0.4)" }}
					onClick={() => setShowModal(false)}
				>
					<div
						className="rounded-3 shadow"
						style={{
							background: "var(--bg-surface)",
							border: "1px solid var(--border-color)",
							minWidth: 220,
							maxWidth: 280,
							maxHeight: "40vh",
							overflow: "hidden",
						}}
						onClick={e => e.stopPropagation()}
					>
						<div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
							<span className="fw-semibold" style={{ fontSize: 15, color: "var(--app-text-primary)" }}>
								Read by
							</span>
							<button
								className="btn btn-sm p-0 border-0"
								onClick={() => setShowModal(false)}
								style={{ lineHeight: 1 }}
							>
								<X size={18} style={{ color: "var(--app-text-secondary)" }} />
							</button>
						</div>
						<div style={{ overflowY: "auto", maxHeight: "calc(60vh - 45px)" }}>
							{readers.map(uid => (
								<ReaderRow key={uid} userId={uid} />
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
