import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { currentUserAtom, updateCurrentUserAtom } from '../../../providers';
import { gameHistoryAtom } from '../../../pages/dashboard/atoms/dashboardData';
import AvatarUtil from '../../../components/AvatarUtil';
import AvatarSelector from '../../../components/AvatarSelector';
import { LogOut } from 'lucide-react';
import ChangePassword from './ChangePassword';

function ProfileStats(): React.JSX.Element {
	const gameHistory = useAtomValue(gameHistoryAtom);

	const totalGames = gameHistory.length;
	const wins = gameHistory.filter((g) => g.result === 'win').length;
	const losses = gameHistory.filter((g) => g.result === 'loss').length;
	const playerSince = gameHistory.length > 0
		? new Date(gameHistory[gameHistory.length - 1].timestamp).getFullYear()
		: new Date().getFullYear();

	return (
		<>
			<p style={{ color: '#666' }}>Player since {playerSince}</p>
			<div className="profile-stats">
				<div className="stat-card">
					<h3>{totalGames}</h3>
					<p>Games Played</p>
				</div>
				<div className="stat-card">
					<h3>{wins}</h3>
					<p>Wins</p>
				</div>
				<div className="stat-card">
					<h3>{losses}</h3>
					<p>Losses</p>
				</div>
			</div>
		</>
	);
}

interface ProfileProps {
	onLogout: () => void;
}

export default function ProfilePage({ onLogout }: ProfileProps): React.JSX.Element {
	const navigate = useNavigate();
	const user = useAtomValue(currentUserAtom);
	const updateCurrentUser = useSetAtom(updateCurrentUserAtom);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
	const [username, setUsername] = useState<string>('');
	const [avatar, setAvatar] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const handleLogout = () => {
		onLogout();
		navigate('/');
	};

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
				{isEditing ? (
					<AvatarSelector
						value={avatar}
						radius={100}
						onChange={(img) => setAvatar(img)}
					/>
				) : (
					<AvatarUtil radius={100} id={user.id} showStatus={false} />
				)}
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
					<Suspense fallback={<p style={{ color: '#666' }}>Loading profile...</p>}>
						<ProfileStats />
					</Suspense>
					{error && <p style={{ color: '#ef4444', marginTop: '0.5rem', marginBottom: 0 }}>{error}</p>}
				</div>
			</div>

			{isChangingPassword ? (
				<ChangePassword onClose={() => setIsChangingPassword(false)} onLogout={handleLogout} />
			) : isEditing ? (
				<div style={{ display: 'flex', gap: '0.75rem' }}>
					<button className="btn-secondary" style={{ width: 'auto' }} onClick={cancelEditing} disabled={isSaving}>Cancel</button>
					<button className="btn-primary" style={{ width: 'auto' }} onClick={saveProfile} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
			) : (
				<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
					<button className="btn-secondary" onClick={startEditing}>Edit Profile</button>
					<button className="btn-secondary" onClick={() => setIsChangingPassword(true)}>Change Password</button>
					<button className="btn-secondary" onClick={() => navigate('/dashboard')}>See Dashboard</button>
					<button className="btn btn-danger d-flex align-items-center" onClick={handleLogout}>
						<LogOut size={18} className="me-1" />
						Logout
					</button>
				</div>
			)}
		</div>
	);
}
