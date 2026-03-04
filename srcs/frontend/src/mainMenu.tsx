import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./pages/message/message.css"

import { Navigation } from './components';
import { apiService } from './services';
import { socketStore } from './store/socketStore';
import type { User } from './models';
import {
	currentUserAtom,
	currentUserLoadingAtom,
	initCurrentUserAtom,
	logoutAtom,
	fetchUserToCacheAtom,
	userCacheFamily
} from './providers';
import {
	receivedInvitationsAtom,
	sentInvitationsAtom,
	type InvitationRelation
} from './providers/invitation.provider';
import {
	friendRelationsAtom,
	type FriendRelation
} from './providers/friend.provider';
import {
	AuthPage,
	GameList,
	DiceGame,
	kingOfDiamond,
	CardGamePage,
	ProfilePage,
	FriendsPage,
	MessagesPage,
	Dashboard,
} from './pages';

import CardGameResult from './pages/games/cardGame/components/CardGameResult';
import {
	MultiplayerLobby,
	MultiplayerSetup,
	GameSetup
} from './pages/games';

// Types
type GameId = 'diceGame' | 'kingOfDiamond' | 'cardGame';

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

	// return <GameList onStartGame={handleStartGame} />;
	return <GameList />;
}

// Game Wrapper with back navigation
interface GameWrapperProps {
	GameComponent: React.ComponentType<{ onBack: () => void }>;
}

function GameWrapper({ GameComponent }: GameWrapperProps): React.JSX.Element {
	const navigate = useNavigate();

	return <GameComponent onBack={() => navigate('/games')} />;
}

// Socket Listener - listens to socket events and updates atoms
function SocketListener(): null {
	const store = useStore();
	const user = useAtomValue(currentUserAtom);

	// Set up Jotai store reference and status callback in socketStore
	useEffect(() => {
		socketStore.setJotaiStore(store);

		// Set up callback for connect/disconnect status updates
		socketStore.setStatusUpdateCallback((isOnline: boolean) => {
			const currentUser = store.get(currentUserAtom);
			if (currentUser) {
				const updatedUser = { ...currentUser, is_online: isOnline };
				store.set(currentUserAtom, updatedUser);
				store.set(userCacheFamily(currentUser.id), updatedUser);
			}
		});
	}, [store]);

	useEffect(() => {
		if (!user) return;

		const handleInvitationReceived = async (data: { invitationId: number; senderId: number }) => {
			// Fetch sender info
			await store.set(fetchUserToCacheAtom, data.senderId);
			// Add to received invitations
			const current = store.get(receivedInvitationsAtom);
			if (!current.find(i => i.invitationId === data.invitationId)) {
				const newInvitation: InvitationRelation = {
					invitationId: data.invitationId,
					senderId: data.senderId,
					status: 'pending',
					createdAt: new Date().toISOString()
				};
				store.set(receivedInvitationsAtom, [...current, newInvitation]);
			}
		};

		const handleInvitationAccepted = async (data: { invitationId: number; friendId: number }) => {
			// Remove from sent invitations
			const sent = store.get(sentInvitationsAtom);
			store.set(sentInvitationsAtom, sent.filter(i => i.invitationId !== data.invitationId));
			// Fetch friend info and add to friends
			await store.set(fetchUserToCacheAtom, data.friendId);
			const friends = store.get(friendRelationsAtom);
			if (!friends.find(f => f.friendId === data.friendId)) {
				const newFriend: FriendRelation = {
					friendId: data.friendId,
					status: 'accepted'
				};
				store.set(friendRelationsAtom, [...friends, newFriend]);
			}
		};

		const handleInvitationDeclined = (data: { invitationId: number }) => {
			const sent = store.get(sentInvitationsAtom);
			store.set(sentInvitationsAtom, sent.filter(i => i.invitationId !== data.invitationId));
		};

		const handleInvitationCancelled = (data: { invitationId: number }) => {
			// Could be in received or sent
			const received = store.get(receivedInvitationsAtom);
			store.set(receivedInvitationsAtom, received.filter(i => i.invitationId !== data.invitationId));
			const sent = store.get(sentInvitationsAtom);
			store.set(sentInvitationsAtom, sent.filter(i => i.invitationId !== data.invitationId));
		};

		const handleFriendRemoved = (data: { friendId: number }) => {
			const friends = store.get(friendRelationsAtom);
			store.set(friendRelationsAtom, friends.filter(f => f.friendId !== data.friendId));
		};

		const handleUserStatusChanged = (data: { userId: number; isOnline: boolean }) => {
			const cachedUser = store.get(userCacheFamily(data.userId));
			if (cachedUser) {
				store.set(userCacheFamily(data.userId), {
					...cachedUser,
					is_online: data.isOnline
				});
			}
		};

		// Register listeners
		socketStore.on('invitation:received', handleInvitationReceived);
		socketStore.on('invitation:accepted', handleInvitationAccepted);
		socketStore.on('invitation:declined', handleInvitationDeclined);
		socketStore.on('invitation:cancelled', handleInvitationCancelled);
		socketStore.on('friend:removed', handleFriendRemoved);
		socketStore.on('user:status-changed', handleUserStatusChanged);

		// Cleanup
		return () => {
			socketStore.off('invitation:received', handleInvitationReceived);
			socketStore.off('invitation:accepted', handleInvitationAccepted);
			socketStore.off('invitation:declined', handleInvitationDeclined);
			socketStore.off('invitation:cancelled', handleInvitationCancelled);
			socketStore.off('friend:removed', handleFriendRemoved);
			socketStore.off('user:status-changed', handleUserStatusChanged);
		};
	}, [user, store]);

	return null;
}

// Main App Component
export default function App(): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);
	const isLoading = useAtomValue(currentUserLoadingAtom);
	const initCurrentUser = useSetAtom(initCurrentUserAtom);
	const logout = useSetAtom(logoutAtom);
	const [theme, setTheme] = useState<'default' | 'neon' | 'dark'>('dark');

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
			<SocketListener />
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

					{/* Games Config */}
					<Route
						path="/games"
						element={
							<ProtectedRoute>
								<GameListWrapper />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/:gameSlug/setup"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={GameSetup} />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/:gameSlug/multiplayer/setup"
						element={
							<ProtectedRoute>
								<MultiplayerSetup />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/:gameSlug/multiplayer/lobby/:roomId"
						element={
							<ProtectedRoute>
								<MultiplayerLobby />
							</ProtectedRoute>
						}
					/>

					{/* Games */}
					<Route
						path="/games/diceGame/:roomId/play"
						// path="/games/diceGame"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={DiceGame} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/diceGame/single"
						// path="/games/diceGame"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={DiceGame} />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/kingOfDiamond/:roomId/play"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={kingOfDiamond} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/kingOfDiamond/single"
						element={
							<ProtectedRoute>
								<GameWrapper GameComponent={kingOfDiamond} />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/cardGame/:roomId/play"
						element={
							<ProtectedRoute>
								<CardGamePage />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/games/cardGame/single"
						element={
							<ProtectedRoute>
								<CardGamePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/games/cardGame/result"
						element={
							<ProtectedRoute>
								<CardGameResult />
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
					<Route
						path="/messages"
						element={
							<ProtectedRoute>
								<MessagesPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					{/* Fallback */}
					{/* <Route path="*" element={<Navigate to="/" replace />} /> */}
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}
