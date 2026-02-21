import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { currentUserAtom, updateCurrentUserAtom } from '../../../providers';
import AvatarUtil from '../../../components/AvatarUtil';
import AvatarSelector from '../../../components/AvatarSelector';

export default function ProfilePage(): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);
	const updateCurrentUser = useSetAtom(updateCurrentUserAtom);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [username, setUsername] = useState<string>('');
	const [avatar, setAvatar] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	if (!user) {
		return <div>Loading...</div>;
	}

	const startEditing = (): void => {
		setUsername(user.username);
		setAvatar(user.avatar || null);
		setError(null);
		setIsEditing(true);
	};

	const cancelEditing = (): void => {
		setIsEditing(false);
		setError(null);
	};

	const saveProfile = async (): Promise<void> => {
		const normalizedUsername = username.trim();
		if (!normalizedUsername) {
			setError('Username cannot be empty');
			return;
		}

		const payload: { username?: string; avatar?: string } = {};
		if (normalizedUsername !== user.username) {
			payload.username = normalizedUsername;
		}
		if (avatar !== null && avatar !== user.avatar) {
			payload.avatar = avatar;
		}

		if (Object.keys(payload).length === 0) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);
		setError(null);
		try {
			await updateCurrentUser(payload);
			setIsEditing(false);
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
				return;
			}
			setError('Failed to update profile');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="profile-container">
			<div className="profile-header">
				<AvatarUtil radius={100} id={user.id} showStatus={true} />
				<div className="profile-info">
					{isEditing ? (
						<div className="form-group" style={{ marginBottom: '0.5rem' }}>
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={isSaving}
							/>
						</div>
					) : (
						<h2>{user.username}</h2>
					)}
					<p style={{ color: '#666' }}>Player since 2024</p>
					{error && <p style={{ color: '#ef4444', marginTop: '0.5rem', marginBottom: 0 }}>{error}</p>}
				</div>
			</div>

			<div className="profile-stats">
				<div className="stat-card">
					<h3>12</h3>
					<p>Games Played</p>
				</div>
				<div className="stat-card">
					<h3>8</h3>
					<p>Wins</p>
				</div>
				<div className="stat-card">
					<h3>4</h3>
					<p>Losses</p>
				</div>
			</div>

			{isEditing ? (
				<div style={{ display: 'flex', gap: '0.75rem' }}>
					<button className="btn-secondary" style={{ width: 'auto' }} onClick={cancelEditing} disabled={isSaving}>Cancel</button>
					<button className="btn-primary" style={{ width: 'auto' }} onClick={saveProfile} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
			) : (
				<button className="btn-secondary" onClick={startEditing}>Edit Profile</button>
			)}
		</div>
	);
}
