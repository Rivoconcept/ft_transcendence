import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import {
	friendsListAtom,
	friendsLoadingAtom,
	fetchFriendsAtom,
	openOrCreateDirectChatAtom,
	createGroupChatAtom,
	selectChatAtom,
} from "../../providers";
import AvatarUtil from "../../components/AvatarUtil";

interface CreateChatModalProps {
	onClose: () => void;
}

type Tab = "direct" | "group";

export default function CreateChatModal({ onClose }: CreateChatModalProps) {
	const navigate = useNavigate();
	const friends = useAtomValue(friendsListAtom);
	const friendsLoading = useAtomValue(friendsLoadingAtom);
	const fetchFriends = useSetAtom(fetchFriendsAtom);
	const openOrCreateDirectChat = useSetAtom(openOrCreateDirectChatAtom);
	const createGroupChat = useSetAtom(createGroupChatAtom);
	const selectChat = useSetAtom(selectChatAtom);

	const [activeTab, setActiveTab] = useState<Tab>("direct");
	const [groupName, setGroupName] = useState("");
	const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
	const [creating, setCreating] = useState(false);
	const [memberSearch, setMemberSearch] = useState("");

	useEffect(() => {
		if (friends.length === 0) {
			fetchFriends();
		}
	}, [friends.length, fetchFriends]);

	const handleDirectChat = useCallback(async (friendId: number) => {
		try {
			setCreating(true);
			const chatId = await openOrCreateDirectChat(friendId);
			await selectChat(chatId);
			navigate(`/messages/${chatId}`);
			onClose();
		} catch {
			setCreating(false);
		}
	}, [openOrCreateDirectChat, selectChat, navigate, onClose]);

	const handleCreateGroup = useCallback(async () => {
		if (!groupName.trim() || selectedMembers.length === 0) return;
		try {
			setCreating(true);
			const chatId = await createGroupChat({ name: groupName.trim(), memberIds: selectedMembers });
			await selectChat(chatId);
			navigate(`/messages/${chatId}`);
			onClose();
		} catch {
			setCreating(false);
		}
	}, [groupName, selectedMembers, createGroupChat, selectChat, navigate, onClose]);

	const toggleMember = (userId: number) => {
		setSelectedMembers(prev =>
			prev.includes(userId)
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		);
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) onClose();
	};

	return (
		<div className="create-chat-overlay" onClick={handleOverlayClick}>
			<div className="create-chat-modal">
				<div className="create-chat-header">
					<h6 className="fw-semibold m-0" style={{ color: "var(--text-primary)" }}>
						New Conversation
					</h6>
					<button className="icon-action" onClick={onClose}>
						<X size={18} className="icon-themed" />
					</button>
				</div>

				<div className="auth-tabs">
					<button
						className={`tab-btn ${activeTab === "direct" ? "active" : ""}`}
						onClick={() => setActiveTab("direct")}
					>
						Direct
					</button>
					<button
						className={`tab-btn ${activeTab === "group" ? "active" : ""}`}
						onClick={() => setActiveTab("group")}
					>
						Group
					</button>
				</div>

				<div className="create-chat-body">
					{activeTab === "group" && (
						<div style={{ padding: "0.75rem 1rem 0" }}>
							<input
								type="text"
								className="form-control" style={{ background: "var(--bg-surface)", color: "var(--app-text-primary)", borderColor: "var(--border-color)" }}
								placeholder="Group name"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
							/>
						</div>
					)}

					<div style={{ padding: "0.75rem 1rem 0" }}>
						<input
							type="text"
							className="form-control" style={{ background: "var(--bg-surface)", color: "var(--app-text-primary)", borderColor: "var(--border-color)" }}
							placeholder="Search friends..."
							value={memberSearch}
							onChange={(e) => setMemberSearch(e.target.value)}
						/>
					</div>

					{friendsLoading && friends.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>
							Loading friends...
						</p>
					)}

					{!friendsLoading && friends.length === 0 && (
						<p className="text-center small mt-4" style={{ color: "var(--text-secondary)" }}>
							No friends yet. Add friends to start chatting!
						</p>
					)}

					<div className="friend-list-modal">
						{friends
							.filter(f => !memberSearch.trim() || f.username.toLowerCase().includes(memberSearch.toLowerCase()))
							.map((friend) => (
								<div
									key={friend.id}
									className="friend-item"
									onClick={() => {
										if (creating) return;
										if (activeTab === "direct") {
											handleDirectChat(friend.id);
										} else {
											toggleMember(friend.id);
										}
									}}
								>
									{activeTab === "group" && (
										<input
											type="checkbox"
											checked={selectedMembers.includes(friend.id)}
											onChange={() => toggleMember(friend.id)}
											onClick={(e) => e.stopPropagation()}
											className="friend-item-checkbox"
										/>
									)}
									<AvatarUtil id={friend.id} radius={38} showStatus={false} />
									<div className="flex-grow-1">
										<span className="fw-semibold" style={{ fontSize: 14, color: "var(--text-primary)" }}>
											{friend.username}
										</span>
									</div>
								</div>
							))}
					</div>
				</div>

				{activeTab === "group" && (
					<div className="create-chat-footer">
						<button
							className="btn-primary w-100"
							onClick={handleCreateGroup}
							disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
							style={{ borderRadius: 8 }}
						>
							{creating ? "Creating..." : `Create Group (${selectedMembers.length})`}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
