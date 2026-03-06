import { useState } from "react";
import AvatarUtil from "../AvatarUtil";
import type { MessageItem } from "../../models";

interface MessageBubbleProps {
	message: MessageItem;
	fromMe: boolean;
	formatTime: (dateStr: string) => string;
	isBlocked?: boolean;
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

export default function MessageBubble({ message, fromMe, formatTime, isBlocked }: MessageBubbleProps) {
	const [revealed, setRevealed] = useState(false);
	const hidden = isBlocked && !revealed;

	const isImage = message.type === "image";
	const parsed = isImage && !hidden ? parseImageContent(message.content) : null;
	const imageOnly = isImage && !hidden && !parsed?.caption;

	return (
		<div className={`d-flex mb-2 ${fromMe ? "justify-content-end" : "justify-content-start"}`}>
			{!fromMe && (
				<div className="me-2 align-self-end">
					<AvatarUtil id={message.authorId} radius={30} showStatus={false} />
				</div>
			)}

			<div>
				<div className={`bubble ${fromMe ? "bubble-me" : "bubble-them"} ${imageOnly ? "bubble-image" : ""} ${isImage && !imageOnly && !hidden ? "bubble-with-image" : ""}`}>
					{hidden ? (
						<span className="blocked-content" onClick={() => setRevealed(true)} style={{ cursor: "pointer" }}>Hidden content</span>
					) : isImage && parsed ? (
						<>
							{parsed.caption && (
								<div className="bubble-caption">{parsed.caption}</div>
							)}
							<img src={parsed.imageUrl} alt="image" className="bubble-img" />
						</>
					) : (
						message.content
					)}
				</div>
				<div
					className={`d-flex align-items-center mt-1 gap-1 ${fromMe ? "justify-content-end" : "justify-content-start"}`}
				>
					<small style={{ fontSize: 11, color: "var(--text-secondary)" }}>
						{formatTime(message.created_at)}
					</small>
				</div>
			</div>
		</div>
	);
}
