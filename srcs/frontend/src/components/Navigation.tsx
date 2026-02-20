import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, User, Users, LogOut } from 'lucide-react';

interface NavigationProps {
	username: string;
	onLogout: () => void;
	theme: 'default' | 'neon' | 'dark';
	onThemeChange: (theme: 'default' | 'neon' | 'dark') => void;
}

export default function Navigation({ username, onLogout, theme, onThemeChange }: NavigationProps): React.JSX.Element {
	const navigate = useNavigate();

	const handleLogout = () => {
		onLogout();
		navigate('/');
	};

	return (
		<nav className="nav">
			<div className="nav-brand">
				<Menu size={24} />
				GameHub
			</div>
			<div className="nav-links">
				<div className="theme-switcher">
					<button
						className={`theme-btn ${theme === 'default' ? 'active' : ''}`}
						onClick={() => onThemeChange('default')}
					>
						Default
					</button>
					<button
						className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
						onClick={() => onThemeChange('dark')}
					>
						Dark
					</button>
				</div>
				<NavLink
					to="/games"
					className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
				>
					Games
				</NavLink>
				<NavLink
					to="/profile/me"
					className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
				>
					<User size={18} />
					{username}
				</NavLink>
				<NavLink
					to="/profile/friends"
					className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
				>
					<Users size={18} />
					Friends
				</NavLink>
				<button className="logout-btn" onClick={handleLogout}>
					<LogOut size={18} />
					Logout
				</button>
			</div>
		</nav>
	);
}
