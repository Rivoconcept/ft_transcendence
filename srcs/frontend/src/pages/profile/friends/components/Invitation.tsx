import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Check, X, UserPlus, Clock, Loader2 } from 'lucide-react';
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
import AvatarUtil from '../../../../components/AvatarUtil';

export default function Invitation(): React.JSX.Element {
	const [username, setUsername] = useState<string>('');
	const [sending, setSending] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

	const receivedInvitations = useAtomValue(receivedInvitationsListAtom);
	const isLoadingReceived = useAtomValue(receivedInvitationsLoadingAtom);
	const fetchReceivedInvitations = useSetAtom(fetchReceivedInvitationsAtom);
	const acceptInvitation = useSetAtom(acceptInvitationAtom);
	const declineInvitation = useSetAtom(declineInvitationAtom);

	const sentInvitations = useAtomValue(sentInvitationsListAtom);
	const isLoadingSent = useAtomValue(sentInvitationsLoadingAtom);
	const fetchSentInvitations = useSetAtom(fetchSentInvitationsAtom);
	const sendInvitation = useSetAtom(sendInvitationAtom);
	const cancelInvitation = useSetAtom(cancelInvitationAtom);

	useEffect(() => {
		fetchReceivedInvitations();
		fetchSentInvitations();
	}, [fetchReceivedInvitations, fetchSentInvitations]);

	const setProcessing = (id: number, isProcessing: boolean) => {
		setProcessingIds(prev => {
			const next = new Set(prev);
			if (isProcessing) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	const handleAccept = async (invitationId: number) => {
		setError(null);
		setProcessing(invitationId, true);
		try {
			await acceptInvitation(invitationId);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to accept invitation';
			setError(message);
		} finally {
			setProcessing(invitationId, false);
		}
	};

	const handleDecline = async (invitationId: number) => {
		setError(null);
		setProcessing(invitationId, true);
		try {
			await declineInvitation(invitationId);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to decline invitation';
			setError(message);
		} finally {
			setProcessing(invitationId, false);
		}
	};

	const handleCancel = async (invitationId: number) => {
		setError(null);
		setProcessing(invitationId, true);
		try {
			await cancelInvitation(invitationId);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to cancel invitation';
			setError(message);
		} finally {
			setProcessing(invitationId, false);
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
			const message = err instanceof Error ? err.message : 'Failed to send friend request';
			setError(message);
		} finally {
			setSending(false);
		}
	};

	const isProcessing = (id: number) => processingIds.has(id);

	return (
		<>
			{/* Global error message */}
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

			{/* Send form */}
			<div style={{ marginBottom: '1.5rem' }}>
				<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Send Friend Request</label>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<input
						type="text"
						placeholder="Enter username..."
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
						style={{
							flex: 1,
							padding: '0.5rem 0.75rem',
							border: '2px solid var(--border-color)',
							borderRadius: '6px',
							fontSize: '0.9rem',
							background: 'var(--bg-surface)',
							color: 'var(--app-text-primary)'
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
						{sending ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
						{sending ? 'Sending...' : 'Send'}
					</button>
				</div>
			</div>

			<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Received Invitations</label>
			{isLoadingReceived && receivedInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: 'var(--app-text-secondary)', marginBottom: '1.5rem' }}>Loading...</p>
			) : receivedInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: 'var(--app-text-secondary)', marginBottom: '1.5rem' }}>No pending invitations</p>
			) : (
				<div style={{ marginBottom: '1.5rem' }}>
					{receivedInvitations.map(inv => (
						<div key={inv.invitationId} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', width: '100%' }}>
							<AvatarUtil id={inv.senderId} radius={36} showStatus={false} />
							<div style={{ flex: 1, minWidth: 0 }}>
								<h3 style={{ margin: 0, fontSize: '0.9rem' }}>{inv.sender?.username || 'Unknown'}</h3>
								<p style={{ margin: 0, color: 'var(--app-text-secondary)', fontSize: '0.75rem' }}>
									{new Date(inv.createdAt).toLocaleDateString()}
								</p>
							</div>
							<div style={{ display: 'flex', gap: '0.25rem' }}>
								<button
									className="btn-primary"
									style={{ padding: '0.35rem' }}
									onClick={() => handleAccept(inv.invitationId)}
									disabled={isProcessing(inv.invitationId)}
								>
									{isProcessing(inv.invitationId) ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
								</button>
								<button
									className="btn-secondary"
									style={{ padding: '0.35rem', color: '#ef4444' }}
									onClick={() => handleDecline(inv.invitationId)}
									disabled={isProcessing(inv.invitationId)}
								>
									<X size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Sent Invitations</label>
			{isLoadingSent && sentInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: 'var(--app-text-secondary)' }}>Loading...</p>
			) : sentInvitations.length === 0 ? (
				<p style={{ textAlign: 'center', color: 'var(--app-text-secondary)' }}>No sent invitations</p>
			) : (
				sentInvitations.map(inv => (
					<div key={inv.invitationId} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', width: '100%' }}>
						<AvatarUtil id={inv.receiverId} radius={36} showStatus={false} />
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
							disabled={isProcessing(inv.invitationId)}
						>
							{isProcessing(inv.invitationId) ? <Loader2 size={14} className="spin" /> : <X size={14} />}
						</button>
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
		</>
	);
}
