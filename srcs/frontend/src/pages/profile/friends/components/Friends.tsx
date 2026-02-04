import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { UserMinus, MessageCircle, Search } from 'lucide-react';
import { friendsListAtom, fetchFriendsAtom, friendsLoadingAtom, removeFriendAtom } from '../../../../providers/friend.provider';

export default function Friends(): React.JSX.Element {
	const [searchQuery, setSearchQuery] = useState<string>('');
	const friends = useAtomValue(friendsListAtom);
	const isLoading = useAtomValue(friendsLoadingAtom);
	const fetchFriends = useSetAtom(fetchFriendsAtom);
	const removeFriend = useSetAtom(removeFriendAtom);

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

	const handleRemoveFriend = (friendId: number) => {
		removeFriend(friendId);
	};

	if (isLoading && friends.length === 0) {
		return <p style={{ textAlign: 'center', color: '#666' }}>Loading friends...</p>;
	}

	return (
		<>
			<div className="form-group" style={{ marginBottom: '1.5rem' }}>
				<div style={{ position: 'relative' }}>
					<Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
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
				<p style={{ textAlign: 'center', color: '#666' }}>No friends found</p>
			) : (
				filteredFriends.map(friend => (
					<div key={friend.id} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
						<div style={{ position: 'relative' }}>
							<div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
								{friend.avatar || friend.username.charAt(0).toUpperCase()}
							</div>
							<span style={{
								position: 'absolute',
								bottom: '0',
								right: '0',
								width: '10px',
								height: '10px',
								borderRadius: '50%',
								backgroundColor: getStatusColor(friend.is_online),
								border: '2px solid white'
							}} />
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{friend.username}</h3>
							<p style={{ margin: 0, color: getStatusColor(friend.is_online), fontSize: '0.75rem' }}>
								{getStatusText(friend.is_online)}
							</p>
						</div>
						<div style={{ display: 'flex', gap: '0.25rem' }}>
							<button className="btn-secondary" style={{ padding: '0.35rem' }}>
								<MessageCircle size={14} />
							</button>
							<button
								className="btn-secondary"
								style={{ padding: '0.35rem', color: '#ef4444' }}
								onClick={() => handleRemoveFriend(friend.id)}
							>
								<UserMinus size={14} />
							</button>
						</div>
					</div>
				))
			)}
		</>
	);
}
