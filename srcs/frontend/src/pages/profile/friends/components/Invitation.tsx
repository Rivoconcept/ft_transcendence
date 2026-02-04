import React, { useState } from 'react';
import { Check, X, UserPlus } from 'lucide-react';

interface InvitationRequest {
	id: string;
	username: string;
	avatar: string;
	sentAt: string;
	gamesPlayed: number;
}

export default function Invitation(): React.JSX.Element {
	const [username, setUsername] = useState<string>('');

	const invitations: InvitationRequest[] = [
		{ id: '1', username: 'NewPlayer1', avatar: 'N', sentAt: '2 hours ago', gamesPlayed: 10 },
		{ id: '2', username: 'ProGamer42', avatar: 'P', sentAt: '1 day ago', gamesPlayed: 156 }
	];

	const handleAccept = (id: string) => {
		console.log('Accept invitation:', id);
	};

	const handleDecline = (id: string) => {
		console.log('Decline invitation:', id);
	};

	const handleSendRequest = () => {
		if (username.trim()) {
			console.log('Send friend request to:', username);
			setUsername('');
		}
	};

	return (
		<>
			<div style={{ marginBottom: '1.5rem' }}>
				<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Send Friend Request</label>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<input
						type="text"
						placeholder="Enter username..."
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						style={{
							flex: 1,
							padding: '0.5rem 0.75rem',
							border: '2px solid var(--border-color)',
							borderRadius: '6px',
							fontSize: '0.9rem',
							background: 'var(--bg-surface)',
							color: 'var(--text-primary)'
						}}
					/>
					<button
						onClick={handleSendRequest}
						disabled={!username.trim()}
						style={{
							padding: '0.5rem 0.75rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.35rem',
							fontSize: '0.85rem',
							background: 'var(--primary-color)',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer'
						}}
					>
						<UserPlus size={14} />
						Send
					</button>
				</div>
			</div>

			<label style={{ marginBottom: '0.5rem', display: 'block' }}>Pending Invitations</label>
			{invitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: '#666' }}>No pending invitations</p>
			) : (
				invitations.map(inv => (
					<div key={inv.id} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
						<div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
							{inv.avatar}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{inv.username}</h3>
							<p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{inv.sentAt}</p>
						</div>
						<div style={{ display: 'flex', gap: '0.25rem' }}>
							<button className="btn-primary" style={{ padding: '0.35rem' }} onClick={() => handleAccept(inv.id)}>
								<Check size={14} />
							</button>
							<button className="btn-secondary" style={{ padding: '0.35rem', color: '#ef4444' }} onClick={() => handleDecline(inv.id)}>
								<X size={14} />
							</button>
						</div>
					</div>
				))
			)}
		</>
	);
}
