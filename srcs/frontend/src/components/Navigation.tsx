import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, User, Users, LogOut, BarChart3, MessageSquare, Gamepad2 } from 'lucide-react';

interface NavigationProps {
	username: string;
	onLogout: () => void;
	theme: 'default' | 'dark';
	onThemeChange: (theme: 'default' | 'dark') => void;
}

export default function Navigation({ username, onLogout, theme, onThemeChange }: NavigationProps): React.JSX.Element {
	const navigate = useNavigate();

	const toggleTheme = () => {
		onThemeChange(theme === 'dark' ? 'default' : 'dark');
	};

	const [isOpen, setIsOpen] = useState(false);

	const handleLogout = () => {
		onLogout();
		navigate('/');
	};

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
					</ul>

					{/* Theme Switch */}
					<div className="d-flex align-items-center gap-3">
						<div className="form-check form-switch m-0">
							<input
								className="form-check-input"
								type="checkbox"
								role="switch"
								id="themeSwitch"
								checked={theme === 'dark'}
								onChange={toggleTheme}
							/>
							<label className="form-check-label" htmlFor="themeSwitch">
								Dark
							</label>
						</div>

						<NavLink to="/profile/me" className="nav-link d-flex align-items-center">
							<User size={18} className="me-1" />
							{username}
						</NavLink>

						<button className="btn btn-danger d-flex align-items-center" onClick={handleLogout}>
							<LogOut size={18} className="me-1" />
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
