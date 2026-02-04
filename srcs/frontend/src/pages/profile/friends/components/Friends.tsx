import React, { useState } from 'react';
import { UserMinus, MessageCircle, Search } from 'lucide-react';

interface Friend {
	id: string;
	username: string;
	avatar: string;
	status: 'online' | 'offline' | 'in-game';
	gamesPlayed: number;
	wins: number;
}

export default function Friends(): React.JSX.Element {
	const [searchQuery, setSearchQuery] = useState<string>('');

	const friends: Friend[] = [
		{ id: '1', username: 'Player1', avatar: 'P', status: 'online', gamesPlayed: 25, wins: 18 },
		{ id: '2', username: 'Player2', avatar: 'P', status: 'in-game', gamesPlayed: 42, wins: 30 },
		{ id: '3', username: 'Player3', avatar: 'P', status: 'offline', gamesPlayed: 15, wins: 8 }
	];

	const filteredFriends = friends.filter(f =>
		f.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const getStatusColor = (status: Friend['status']): string => {
		switch (status) {
			case 'online': return '#22c55e';
			case 'in-game': return '#f59e0b';
			case 'offline': return '#6b7280';
		}
	};

	const getStatusText = (status: Friend['status']): string => {
		switch (status) {
			case 'online': return 'Online';
			case 'in-game': return 'In Game';
			case 'offline': return 'Offline';
		}
	};

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
								{friend.avatar}
							</div>
							<span style={{
								position: 'absolute',
								bottom: '0',
								right: '0',
								width: '10px',
								height: '10px',
								borderRadius: '50%',
								backgroundColor: getStatusColor(friend.status),
								border: '2px solid white'
							}} />
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{friend.username}</h3>
							<p style={{ margin: 0, color: getStatusColor(friend.status), fontSize: '0.75rem' }}>
								{getStatusText(friend.status)}
							</p>
						</div>
						<div style={{ display: 'flex', gap: '0.25rem' }}>
							<button className="btn-secondary" style={{ padding: '0.35rem' }}>
								<MessageCircle size={14} />
							</button>
							<button className="btn-secondary" style={{ padding: '0.35rem', color: '#ef4444' }}>
								<UserMinus size={14} />
							</button>
						</div>
					</div>
				))
			)}
		</>
	);
}
