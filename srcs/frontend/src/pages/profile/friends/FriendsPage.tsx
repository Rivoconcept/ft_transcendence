import React, { useState } from 'react';
import { Friends, Invitation } from './components';

type Tab = 'friends' | 'invitations';

export default function FriendsPage(): React.JSX.Element {
	const [activeTab, setActiveTab] = useState<Tab>('friends');

	return (
		<div className="profile-container">
			<div className="profile-header">
				<h2>Friends</h2>
			</div>

			<div className="auth-tabs" style={{ marginBottom: '1.5rem' }}>
				<button
					className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
					onClick={() => setActiveTab('friends')}
				>
					Friends
				</button>
				<button
					className={`tab-btn ${activeTab === 'invitations' ? 'active' : ''}`}
					onClick={() => setActiveTab('invitations')}
				>
					Invitations
				</button>
			</div>

			{activeTab === 'friends' && <Friends />}
			{activeTab === 'invitations' && <Invitation />}
		</div>
	);
}
