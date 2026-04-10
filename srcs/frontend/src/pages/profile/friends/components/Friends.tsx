import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { UserMinus, MessageCircle, Search, Loader2, ShieldBan } from 'lucide-react';
import { friendsListAtom, fetchFriendsAtom, friendsLoadingAtom, removeFriendAtom } from '../../../../providers/friend.provider';
import { openOrCreateDirectChatAtom } from '../../../../providers/chat.provider';
import { blockUserAtom } from '../../../../providers/block.provider';
import AvatarUtil from '../../../../components/AvatarUtil';
import UserProfileModal from '../../../../components/UserProfileModal';

export default function Friends(): React.JSX.Element {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

	const friends = useAtomValue(friendsListAtom);
	const isLoading = useAtomValue(friendsLoadingAtom);
	const fetchFriends = useSetAtom(fetchFriendsAtom);
	const removeFriend = useSetAtom(removeFriendAtom);
	const openOrCreateDirectChat = useSetAtom(openOrCreateDirectChatAtom);
	const blockUser = useSetAtom(blockUserAtom);
	const [blockingIds, setBlockingIds] = useState<Set<number>>(new Set());
	const [profileUserId, setProfileUserId] = useState<number | null>(null);

	useEffect(() => {
		fetchFriends();
	}, [fetchFriends]);

	const filteredFriends = friends.filter(f =>
		f.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const getStatusColor = (isOnline: boolean): string => {
		return isOnline ? '#22c55e' : '#6b7280';
	};

	const getStatusText = (isOnline: boolean): string => {
		return isOnline ? 'Online' : 'Offline';
	};

	const handleRemoveFriend = async (friendId: number) => {
		if (!window.confirm('Are you sure you want to remove this friend?')) return;
		setError(null);
		setRemovingIds(prev => new Set(prev).add(friendId));

		try {
			await removeFriend(friendId);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to remove friend';
			setError(message);
		} finally {
			setRemovingIds(prev => {
				const next = new Set(prev);
				next.delete(friendId);
				return next;
			});
		}
	};

	const handleBlockUser = async (friendId: number) => {
		if (!window.confirm('Are you sure you want to block this user?')) return;
		setError(null);
		setBlockingIds(prev => new Set(prev).add(friendId));

		try {
			await blockUser(friendId);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to block user';
			setError(message);
		} finally {
			setBlockingIds(prev => {
				const next = new Set(prev);
				next.delete(friendId);
				return next;
			});
		}
	};

	const handleOpenChat = async (friendId: number) => {
		try {
			const chatId = await openOrCreateDirectChat(friendId);
			navigate(`/messages/${chatId}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to open chat';
			setError(message);
		}
	};

	if (isLoading && friends.length === 0) {
		return <p style={{ textAlign: 'center', color: 'var(--app-text-secondary)' }}>Loading friends...</p>;
	}

	return (
		<>
			{error && (
				<div style={{
					color: '#ef4444',
					marginBottom: '1rem',
					padding: '0.5rem 0.75rem',
					background: 'var(--bg-surface)',
					borderRadius: '6px',
					fontSize: '0.85rem'
				}}>
					{error}
				</div>
			)}

			<div className="form-group" style={{ marginBottom: '1.5rem' }}>
				<div style={{ position: 'relative' }}>
					<Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--app-text-secondary)' }} />
					<input
						type="text"
						placeholder="Search friends..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{ paddingLeft: '40px' }}
					/>
				</div>
			</div>

			{filteredFriends.length === 0 ? (
				<p style={{ textAlign: 'center', color: 'var(--app-text-secondary)' }}>No friends found</p>
			) : (
				filteredFriends.map(friend => (
					<div key={friend.id} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', width: '100%' }}>
						<AvatarUtil id={friend.id} radius={36} showStatus={true} hasInfo={true} />
						<div style={{ flex: 1, minWidth: 0 }} onClick={() => setProfileUserId(friend.id)}>
							<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{friend.username}</h3>
							<p style={{ margin: 0, color: getStatusColor(friend.is_online), fontSize: '0.75rem' }}>
								{getStatusText(friend.is_online)}
							</p>
						</div>
						<div style={{ display: 'flex', gap: '0.25rem' }}>
							<button className="btn-secondary" style={{ padding: '0.35rem' }} onClick={() => handleOpenChat(friend.id)} title="Message">
								<MessageCircle size={14} />
							</button>
							<button
								className="btn-secondary"
								style={{ padding: '0.35rem', color: '#ef4444' }}
								onClick={() => handleBlockUser(friend.id)}
								disabled={blockingIds.has(friend.id)}
								title="Block"
							>
								{blockingIds.has(friend.id) ? <Loader2 size={14} className="spin" /> : <ShieldBan size={14} />}
							</button>
							<button
								className="btn-secondary"
								style={{ padding: '0.35rem', color: '#ef4444' }}
								onClick={() => handleRemoveFriend(friend.id)}
								disabled={removingIds.has(friend.id)}
								title="Remove friend"
							>
								{removingIds.has(friend.id) ? <Loader2 size={14} className="spin" /> : <UserMinus size={14} />}
							</button>
						</div>
					</div>
				))
			)}

			<style>{`
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				.spin {
					animation: spin 1s linear infinite;
				}
			`}</style>

			{profileUserId !== null && (
				<UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
			)}
		</>
	);
}
