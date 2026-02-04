import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { Navigation } from './components';
import { apiService } from './services';
import type { User } from './models';
import {
	currentUserAtom,
	currentUserLoadingAtom,
	initCurrentUserAtom,
	logoutAtom
} from './providers';
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
	children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);

	if (!user) {
		return <Navigate to="/" replace />;
	}
	return <>{children}</>;
}

// Public Route - redirect to /games if already logged in
interface PublicRouteProps {
	children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);

	if (user) {
		return <Navigate to="/games" replace />;
	}
	return <>{children}</>;
}

// Layout with Navigation
interface LayoutProps {
	user: User | null;
	onLogout: () => void;
	theme: 'default' | 'neon' | 'dark';
	onThemeChange: (theme: 'default' | 'neon' | 'dark') => void;
	children: React.ReactNode;
}

function Layout({ user, onLogout, theme, onThemeChange, children }: LayoutProps): React.JSX.Element {
	return (
		<div className="app">
			{user && (
				<Navigation
					username={user.username}
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

// Main App Component
export default function App(): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);
	const isLoading = useAtomValue(currentUserLoadingAtom);
	const initCurrentUser = useSetAtom(initCurrentUserAtom);
	const logout = useSetAtom(logoutAtom);
	const [theme, setTheme] = useState<'default' | 'neon' | 'dark'>('default');

	// Load token and fetch user on mount
	useEffect(() => {
		const init = async () => {
			apiService.loadToken();
			if (apiService.isAuthenticated()) {
				await initCurrentUser();
			}
		};
		init();
	}, [initCurrentUser]);

	// Theme effect
	useEffect(() => {
		if (theme === 'neon')
			document.documentElement.setAttribute('data-theme', 'neon');
		else if (theme === 'dark')
			document.documentElement.setAttribute('data-theme', 'dark');
		else
			document.documentElement.removeAttribute('data-theme');
	}, [theme]);

	const handleLogout = (): void => {
		logout();
	};

	if (isLoading) {
		return (
			<div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<BrowserRouter>
			<Layout
				user={user}
				onLogout={handleLogout}
				theme={theme}
				onThemeChange={setTheme}
			>
				<Routes>
					{/* Auth */}
					<Route
						path="/"
						element={
							<PublicRoute>
								<AuthPage />
							</PublicRoute>
						}
					/>

					{/* Games */}
					<Route
						path="/games"
						element={
							<ProtectedRoute>
								<GameListWrapper />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/diceGame"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={DiceGame} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/numberGame"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={NumberGame} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/status"
						element={
							<ProtectedRoute>
								<StatusScreen />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/winner"
						element={
							<ProtectedRoute>
								<WinnerScreen />
							</ProtectedRoute>
						}
					/>

					{/* Profile */}
					<Route
						path="/profile/me"
						element={
							<ProtectedRoute>
								<ProfilePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile/friends"
						element={
							<ProtectedRoute>
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
