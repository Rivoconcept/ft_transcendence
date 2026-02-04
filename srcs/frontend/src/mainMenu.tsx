import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { Navigation } from './components';
import {
	AuthPage,
	GameList,
	DiceGame,
	NumberGame,
	StatusScreen,
	WinnerScreen,
	ProfilePage,
	FriendsPage
} from './pages';

// Types
type GameId = 'diceGame' | 'numberGame';

// Protected Route Wrapper
interface ProtectedRouteProps {
	isLoggedIn: boolean;
	children: React.ReactNode;
}

function ProtectedRoute({ isLoggedIn, children }: ProtectedRouteProps): React.JSX.Element {
	if (!isLoggedIn) {
		return <Navigate to="/" replace />;
	}
	return <>{children}</>;
}

// Layout with Navigation
interface LayoutProps {
	isLoggedIn: boolean;
	username: string;
	onLogout: () => void;
	theme: 'default' | 'neon' | 'dark';
	onThemeChange: (theme: 'default' | 'neon' | 'dark') => void;
	children: React.ReactNode;
}

function Layout({ isLoggedIn, username, onLogout, theme, onThemeChange, children }: LayoutProps): React.JSX.Element {
	return (
		<div className="app">
			{isLoggedIn && (
				<Navigation
					username={username}
					onLogout={onLogout}
					theme={theme}
					onThemeChange={onThemeChange}
				/>
			)}
			<main className="main-content">
				{children}
			</main>
		</div>
	);
}

// Game List Wrapper with navigation
function GameListWrapper(): React.JSX.Element {
	const navigate = useNavigate();

	const handleStartGame = (gameId: GameId): void => {
		navigate(`/games/${gameId}`);
	};

	return <GameList onStartGame={handleStartGame} />;
}

// Game Wrapper with back navigation
interface GameWrapperProps {
	GameComponent: React.ComponentType<{ onBack: () => void }>;
}

function GameWrapper({ GameComponent }: GameWrapperProps): React.JSX.Element {
	const navigate = useNavigate();

	return <GameComponent onBack={() => navigate('/games')} />;
}

// Auth Wrapper
interface AuthWrapperProps {
	onLogin: (username: string) => void;
	isLoggedIn: boolean;
}

function AuthWrapper({ onLogin, isLoggedIn }: AuthWrapperProps): React.JSX.Element {
	if (isLoggedIn) {
		return <Navigate to="/games" replace />;
	}
	return <AuthPage onLogin={onLogin} />;
}

// Main App Component
export default function App(): React.JSX.Element {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [username, setUsername] = useState<string>('');
	const [theme, setTheme] = useState<'default' | 'neon' | 'dark'>('default');

	React.useEffect(() => {
		if (theme === 'neon')
			document.documentElement.setAttribute('data-theme', 'neon');
		else if (theme === 'dark')
			document.documentElement.setAttribute('data-theme', 'dark');
		else
			document.documentElement.removeAttribute('data-theme');
	}, [theme]);

	const handleLogin = (user: string): void => {
		setUsername(user);
		setIsLoggedIn(true);
	};

	const handleLogout = (): void => {
		setIsLoggedIn(false);
		setUsername('');
	};

	return (
		<BrowserRouter>
			<Layout
				isLoggedIn={isLoggedIn}
				username={username}
				onLogout={handleLogout}
				theme={theme}
				onThemeChange={setTheme}
			>
				<Routes>
					{/* Auth */}
					<Route
						path="/"
						element={<AuthWrapper onLogin={handleLogin} isLoggedIn={isLoggedIn} />}
					/>

					{/* Games */}
					<Route
						path="/games"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<GameListWrapper />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/diceGame"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<GameWrapper GameComponent={DiceGame} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/numberGame"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<GameWrapper GameComponent={NumberGame} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/status"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<StatusScreen />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/winner"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<WinnerScreen />
							</ProtectedRoute>
						}
					/>

					{/* Profile */}
					<Route
						path="/profile/me"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<ProfilePage username={username} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile/friends"
						element={
							<ProtectedRoute isLoggedIn={isLoggedIn}>
								<FriendsPage />
							</ProtectedRoute>
						}
					/>

					{/* Fallback */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}
