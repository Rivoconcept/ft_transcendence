import React, { useState } from 'react';
import { userService } from '../../../services';

interface ChangePasswordProps {
	onClose: () => void;
	onLogout: () => void;
}

export default function ChangePassword({ onClose, onLogout }: ChangePasswordProps): React.JSX.Element {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const passwordsMatch = newPassword === confirmPassword;
	const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

	const handleSubmit = async () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError('Please fill in all fields');
			return;
		}
		if (!passwordsMatch) {
			setError('New passwords do not match');
			return;
		}
		if (newPassword.length < 6) {
			setError('New password must be at least 6 characters');
			return;
		}

		setError(null);
		setIsLoading(true);
		try {
			await userService.changePassword(currentPassword, newPassword);
			setShowLogoutModal(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to change password');
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleSubmit();
	};

	return (
		<div className="profile-container">
			<div className="profile-header">
				<h2>Change Password</h2>
			</div>

			{error && (
				<div style={{
					color: '#ef4444',
					marginBottom: '1rem',
					padding: '0.5rem',
					background: '#fef2f2',
					borderRadius: 4,
				}}>
					{error}
				</div>
			)}

			<div className="form-group">
				<label>Current Password</label>
				<input
					type="password"
					placeholder="Enter current password"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
					onKeyUp={handleKeyPress}
					disabled={isLoading}
				/>
			</div>

			<div className="form-group">
				<label>New Password</label>
				<input
					type="password"
					placeholder="Enter new password"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					onKeyUp={handleKeyPress}
					disabled={isLoading}
				/>
			</div>

			<div className="form-group">
				<label>Confirm New Password</label>
				<input
					type="password"
					placeholder="Confirm new password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					onKeyUp={handleKeyPress}
					disabled={isLoading}
					style={showMismatch ? { borderColor: '#ef4444' } : undefined}
				/>
				{showMismatch && (
					<span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
						Passwords do not match
					</span>
				)}
			</div>

			<div style={{ display: 'flex', gap: '0.75rem' }}>
				<button className="btn-secondary" onClick={onClose} disabled={isLoading}>
					Cancel
				</button>
				<button
					className="btn-primary"
					onClick={handleSubmit}
					disabled={isLoading || showMismatch}
				>
					{isLoading ? 'Changing...' : 'Change Password'}
				</button>
			</div>

			{showLogoutModal && (
				<div
					className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
					style={{ zIndex: 1060, background: 'rgba(0,0,0,0.4)' }}
				>
					<div
						className="rounded-3 shadow p-4"
						style={{
							background: 'var(--bg-surface)',
							border: '1px solid var(--border-color)',
							maxWidth: 340,
							width: '100%',
						}}
					>
						<h5 className="mb-3" style={{ color: 'var(--app-text-primary)' }}>
							Password changed!
						</h5>
						<p style={{ color: 'var(--app-text-secondary)', fontSize: 14, marginBottom: '1.5rem' }}>
							Do you want to log out now or continue using the app?
						</p>
						<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
							<button className="btn-secondary" onClick={onClose}>
								Continue
							</button>
							<button className="btn btn-danger" onClick={onLogout}>
								Log out
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
