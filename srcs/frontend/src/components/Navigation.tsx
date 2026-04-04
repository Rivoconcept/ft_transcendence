import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Users, BarChart3, MessageSquare, Gamepad2, FileText, Moon, Sun } from 'lucide-react';
import AvatarUtil from "../components/AvatarUtil";
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../providers/user.provider';

interface NavigationProps {
	username: string;
	theme: 'default' | 'dark';
	onThemeChange: (theme: 'default' | 'dark') => void;
}

export default function Navigation({ username, theme, onThemeChange }: NavigationProps): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);

	const toggleTheme = () => {
		onThemeChange(theme === 'dark' ? 'default' : 'dark');
	};

	const [isOpen, setIsOpen] = useState(false);

	return (
		<nav className="navbar navbar-expand-lg shadow-sm px-3">
			<div className="container-fluid">
				<NavLink to="/games" className="navbar-brand fw-bold">
					GameHub
				</NavLink>

				<button
					className="navbar-toggler"
					type="button"
					onClick={() => setIsOpen(!isOpen)}
				>
					<Menu size={24} />
				</button>

				<div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
					<ul className="navbar-nav me-auto mb-2 mb-lg-0">
						<li className="nav-item">
							<NavLink to="/dashboard" className="nav-link">
								<BarChart3 size={18} className="me-1" />
								Dashboard
							</NavLink>
						</li>

						<li className="nav-item">
							<NavLink to="/messages" className="nav-link">
								<MessageSquare size={16} className="me-1" />
								Message
							</NavLink>
						</li>

						<li className="nav-item">
							<NavLink to="/games" className="nav-link">
								<Gamepad2 size={16} className="me-1" />
								Games
							</NavLink>
						</li>

						<li className="nav-item">
							<NavLink to="/profile/friends" className="nav-link">
								<Users size={18} className="me-1" />
								Friends
							</NavLink>
						</li>
						<li className="nav-item">
							<NavLink to="/legal" className="nav-link">
								<FileText size={18} className="me-1" />
								Legals
							</NavLink>
						</li>
					</ul>

					{/* Theme Switch */}
					<div className="d-flex align-items-center gap-3">
						<button className="dark-theme-btn" onClick={toggleTheme}>
							{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
						</button>

						<NavLink to="/profile/me" className="nav-link d-flex align-items-center">
							{user && user.id ? (<AvatarUtil radius={40} id={user.id} showStatus={false} />) : null}
							{username}
						</NavLink>
					</div>
				</div>
			</div>
		</nav>
	);
}
