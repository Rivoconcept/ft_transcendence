import React from 'react';

interface ProfilePageProps {
	username: string;
}

export default function ProfilePage({ username }: ProfilePageProps): React.JSX.Element {
	return (
		<div className="profile-container">
			<div className="profile-header">
				<div className="avatar">
					{username.charAt(0).toUpperCase()}
				</div>
				<div className="profile-info">
					<h2>{username}</h2>
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
