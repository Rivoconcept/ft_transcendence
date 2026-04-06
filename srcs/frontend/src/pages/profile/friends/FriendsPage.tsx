import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Friends, Invitation } from './components';

type Tab = 'list' | 'invitation';

export default function FriendsPage(): React.JSX.Element {
	const { tab } = useParams<{ tab?: string }>();
	const navigate = useNavigate();
	const activeTab: Tab = tab === 'invitation' ? 'invitation' : 'list';

	return (
		<div className="profile-container">
			<div className="profile-header">
				<h2>Friends</h2>
			</div>

			<div className="auth-tabs" style={{ marginBottom: '1.5rem' }}>
				<button
					className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
					onClick={() => navigate('/profile/friends/list')}
				>
					Friends
				</button>
				<button
					className={`tab-btn ${activeTab === 'invitation' ? 'active' : ''}`}
					onClick={() => navigate('/profile/friends/invitation')}
				>
					Invitations
				</button>
			</div>

			{activeTab === 'list' && <Friends />}
			{activeTab === 'invitation' && <Invitation />}
		</div>
	);
}
