import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, User, Users, LogOut, BarChart3, ChevronRight, MessageSquare, Gamepad2 } from 'lucide-react';
import { CardGameRules, DiceGameRules, KingOfDiamondRules, PrivacyPolicy, TermsOfService } from './Rules';

interface NavigationProps {
	username: string;
	onLogout: () => void;
	theme: 'default' | 'dark';
	onThemeChange: (theme: 'default' | 'dark') => void;
}

export default function Navigation({ username, onLogout, theme, onThemeChange }: NavigationProps): React.JSX.Element {
	const navigate = useNavigate();
	const [activeModal, setActiveModal] = useState<
		null | 'about' | 'tos' | 'privacy' | 'rules' | 'dice' | 'king' | 'card'
	>(null);
	const aboutButtonRef = useRef<HTMLButtonElement | null>(null);
	const [aboutPopoverPos, setAboutPopoverPos] = useState<{ top: number; left: number } | null>(null);

	const toggleTheme = () => {
		onThemeChange(theme === 'dark' ? 'default' : 'dark');
	};

	const [isOpen, setIsOpen] = useState(false);

	const computeAboutPopoverPos = () => {
		const el = aboutButtonRef.current;
		if (!el) return;

		const rect = el.getBoundingClientRect();
		const maxWidth = 360;
		const viewportPadding = 12;
		const top = rect.bottom + 8;
		const left = Math.min(rect.left, window.innerWidth - maxWidth - viewportPadding);
		setAboutPopoverPos({ top, left: Math.max(viewportPadding, left) });
	};

	useEffect(() => {
		if (activeModal !== 'about') return;

		computeAboutPopoverPos();
		const onReflow = () => computeAboutPopoverPos();
		window.addEventListener('resize', onReflow);
		window.addEventListener('scroll', onReflow, true);
		return () => {
			window.removeEventListener('resize', onReflow);
			window.removeEventListener('scroll', onReflow, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeModal]);

	const openAboutPopover = () => {
		setActiveModal('about');
		// Compute right away for snappy open; effect will also run.
		queueMicrotask(() => computeAboutPopoverPos());
	};

	const handleLogout = () => {
		onLogout();
		navigate('/');
	};

	const closeAllModals = () => setActiveModal(null);

	const renderOverlay = () => {
		if (!activeModal) return null;

		const handleEntryClick = (next: Exclude<typeof activeModal, null>) => {
			setActiveModal(next);
		};

		const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (e) => {
			e.stopPropagation();
		};

		// About menu
		if (activeModal === 'about') {
			const popoverStyle = aboutPopoverPos ? { position: 'fixed' as const, top: aboutPopoverPos.top, left: aboutPopoverPos.left } : undefined;
			return (
				<div className="about-overlay about-overlay--popover" onClick={closeAllModals}>
					<div
						className="about-modal about-modal--popover"
						style={popoverStyle}
						onClick={stopPropagation}
					>
						<div className="about-modal__heading">About</div>
						<div className="about-modal__list">
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('privacy')}
							>
								<span>Privacy Policy</span>
								<ChevronRight size={16} />
							</button>
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('tos')}
							>
								<span>Terms of Service</span>
								<ChevronRight size={16} />
							</button>
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('rules')}
							>
								<span>Game rules</span>
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				</div>
			);
		}

		if (activeModal === 'privacy') {
			return (
				<div className="about-overlay" onClick={closeAllModals}>
					<div className="about-modal about-modal--wide" onClick={stopPropagation}>
						<button
							type="button"
							className="about-modal__close"
							onClick={closeAllModals}
						>
							×
						</button>
						<div className="about-modal__heading">Privacy Policy</div>
						<div className="about-modal__body about-modal__body--scroll">
							<PrivacyPolicy />
						</div>
					</div>
				</div>
			);
		}

		if (activeModal === 'tos') {
			return (
				<div className="about-overlay" onClick={closeAllModals}>
					<div className="about-modal about-modal--wide" onClick={stopPropagation}>
						<button
							type="button"
							className="about-modal__close"
							onClick={closeAllModals}
						>
							×
						</button>
						<div className="about-modal__heading">Terms of Service</div>
						<div className="about-modal__body about-modal__body--scroll">
							<TermsOfService />
						</div>
					</div>
				</div>
			);
		}

		// Game rules menu
		if (activeModal === 'rules') {
			return (
				<div className="about-overlay" onClick={closeAllModals}>
					<div className="about-modal" onClick={stopPropagation}>
						<div className="about-modal__heading">Game rules</div>
						<div className="about-modal__list">
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('dice')}
							>
								<span>Dice Game</span>
								<ChevronRight size={16} />
							</button>
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('king')}
							>
								<span>King of Diamond</span>
								<ChevronRight size={16} />
							</button>
							<button
								type="button"
								className="about-modal__entry"
								onClick={() => handleEntryClick('card')}
							>
								<span>Card Game</span>
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				</div>
			);
		}

		const renderRuleBody = () => {
			switch (activeModal) {
				case 'dice':
					return (
						<>
							<div className="about-modal__heading">Dice Game rules</div>
							<DiceGameRules />
						</>
					);
				case 'king':
					return (
						<>
							<div className="about-modal__heading">King of Diamond rules</div>
							<KingOfDiamondRules />
						</>
					);
				case 'card':
					return (
						<>
							<div className="about-modal__heading">Card Game rules</div>
							<CardGameRules />
						</>
					);
				default:
					return null;
			}
		};

		return (
			<div className="about-overlay" onClick={closeAllModals}>
				<div className="about-modal about-modal--wide" onClick={stopPropagation}>
					<button
						type="button"
						className="about-modal__close"
						onClick={closeAllModals}
					>
						×
					</button>
					{renderRuleBody()}
				</div>
			</div>
		);
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
