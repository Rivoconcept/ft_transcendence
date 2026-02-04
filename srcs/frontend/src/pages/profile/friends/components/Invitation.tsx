import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Check, X, UserPlus, Clock } from 'lucide-react';
import {
	receivedInvitationsListAtom,
	receivedInvitationsLoadingAtom,
	fetchReceivedInvitationsAtom,
	acceptInvitationAtom,
	declineInvitationAtom,
	sentInvitationsListAtom,
	sentInvitationsLoadingAtom,
	fetchSentInvitationsAtom,
	sendInvitationAtom,
	cancelInvitationAtom
} from '../../../../providers/invitation.provider';

export default function Invitation(): React.JSX.Element {
	const [username, setUsername] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Invitations reçues
	const receivedInvitations = useAtomValue(receivedInvitationsListAtom);
	const isLoadingReceived = useAtomValue(receivedInvitationsLoadingAtom);
	const fetchReceivedInvitations = useSetAtom(fetchReceivedInvitationsAtom);
	const acceptInvitation = useSetAtom(acceptInvitationAtom);
	const declineInvitation = useSetAtom(declineInvitationAtom);

	// Invitations envoyées
	const sentInvitations = useAtomValue(sentInvitationsListAtom);
	const isLoadingSent = useAtomValue(sentInvitationsLoadingAtom);
	const fetchSentInvitations = useSetAtom(fetchSentInvitationsAtom);
	const sendInvitation = useSetAtom(sendInvitationAtom);
	const cancelInvitation = useSetAtom(cancelInvitationAtom);

	useEffect(() => {
		fetchReceivedInvitations();
		fetchSentInvitations();
	}, [fetchReceivedInvitations, fetchSentInvitations]);

	const handleAccept = async (invitationId: number) => {
		try {
			await acceptInvitation(invitationId);
		} catch (err) {
			console.error('Failed to accept invitation:', err);
		}
	};

	const handleDecline = async (invitationId: number) => {
		try {
			await declineInvitation(invitationId);
		} catch (err) {
			console.error('Failed to decline invitation:', err);
		}
	};

	const handleCancel = async (invitationId: number) => {
		try {
			await cancelInvitation(invitationId);
		} catch (err) {
			console.error('Failed to cancel invitation:', err);
		}
	};

	const handleSendRequest = async () => {
		if (!username.trim()) return;

		setSending(true);
		setError(null);

		try {
			await sendInvitation(username.trim());
			setUsername('');
		} catch (err) {
			setError('Failed to send friend request');
		} finally {
			setSending(false);
		}
	};

	return (
		<>
			{/* Formulaire d'envoi */}
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
						disabled={!username.trim() || sending}
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
							cursor: 'pointer',
							opacity: (!username.trim() || sending) ? 0.6 : 1
						}}
					>
						<UserPlus size={14} />
						{sending ? 'Sending...' : 'Send'}
					</button>
				</div>
				{error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
			</div>

			{/* Invitations reçues */}
			<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Received Invitations</label>
			{isLoadingReceived && receivedInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>Loading...</p>
			) : receivedInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>No pending invitations</p>
			) : (
				<div style={{ marginBottom: '1.5rem' }}>
					{receivedInvitations.map(inv => (
						<div key={inv.invitationId} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
							<div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
								{inv.sender?.avatar || inv.sender?.username?.charAt(0).toUpperCase() || '?'}
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{inv.sender?.username || 'Unknown'}</h3>
								<p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
									{new Date(inv.createdAt).toLocaleDateString()}
								</p>
							</div>
							<div style={{ display: 'flex', gap: '0.25rem' }}>
								<button className="btn-primary" style={{ padding: '0.35rem' }} onClick={() => handleAccept(inv.invitationId)}>
									<Check size={14} />
								</button>
								<button className="btn-secondary" style={{ padding: '0.35rem', color: '#ef4444' }} onClick={() => handleDecline(inv.invitationId)}>
									<X size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Invitations envoyées */}
			<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Sent Invitations</label>
			{isLoadingSent && sentInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
			) : sentInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: '#666' }}>No sent invitations</p>
			) : (
				sentInvitations.map(inv => (
					<div key={inv.invitationId} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
						<div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
							{inv.receiver?.avatar || inv.receiver?.username?.charAt(0).toUpperCase() || '?'}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{inv.receiver?.username || 'Unknown'}</h3>
							<p style={{ margin: 0, color: '#f59e0b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
								<Clock size={12} /> Pending
							</p>
						</div>
						<button
							className="btn-secondary"
							style={{ padding: '0.35rem', color: '#ef4444' }}
							onClick={() => handleCancel(inv.invitationId)}
						>
							<X size={14} />
						</button>
					</div>
				))
			)}
		</>
	);
}
