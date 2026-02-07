import React from 'react';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../../../providers';
import AvatarUtil from '../../../components/AvatarUtil';

export default function ProfilePage(): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);

	if (!user) {
		return <div>Loading...</div>;
	}

	return (
		<div className="profile-container">
			<div className="profile-header">
				<AvatarUtil radius={100} id={user.id} showStatus={false} />
				<div className="profile-info">
					<h2>{user.username}</h2>
					<p style={{ color: '#666' }}>Player since 2024</p>
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

			<button className="btn-secondary">Edit Profile</button>
		</div>
	);
}
