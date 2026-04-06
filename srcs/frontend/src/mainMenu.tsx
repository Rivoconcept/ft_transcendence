import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./pages/message/message.css"
import { refreshGameHistoryAtom, startOnlineSessionAtom, stopOnlineSessionAtom } from './pages/dashboard/atoms/dashboardData';

import { Navigation } from './components';
import { apiService } from './services';
import { socketStore } from './store/socketStore';
import type { User, ChatListItem, MessageItem } from './models';
import {
	currentUserAtom,
	currentUserLoadingAtom,
	initCurrentUserAtom,
	logoutAtom,
	fetchUserToCacheAtom,
	userCacheFamily,
	onNewMessageAtom,
	onChatCreatedAtom,
	onMessageReadAtom
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
	LandingPage,
	LegalPage,
	GameList,
	kingOfDiamond,
	CardGamePage,
	ProfilePage,
	FriendsPage,
	MessagesPage,
	Dashboard,
} from './pages';

import CardGameResult from './pages/games/cardGame/components/CardGameResultSingle';
import {
	MultiplayerLobby,
	MultiplayerSetup,
	GameSetup
} from './pages/games';
import CardGameMultiResult from './pages/games/cardGame/components/CardGameResultMulti';

// Types
type GameId = 'kingOfDiamond' | 'cardGame';

// Protected Route Wrapper
interface ProtectedRouteProps {
	children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
	const user = useAtomValue(currentUserAtom);
	const loading = useAtomValue(currentUserLoadingAtom);

	if (loading) {
		return <></>;
	}
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
	theme: 'default' | 'dark';
	onThemeChange: (theme: 'default' | 'dark') => void;
	children: React.ReactNode;
}

function Layout({ user, theme, onThemeChange, children }: LayoutProps): React.JSX.Element {
	return (
		<div className="app">
			{user && (
				<Navigation
					username={user.username}
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

		const handleUserStatusChanged = async (data: { userId: number; isOnline: boolean }) => {
			let cachedUser = store.get(userCacheFamily(data.userId));
			if (!cachedUser) {
				cachedUser = await store.set(fetchUserToCacheAtom, data.userId) as User | null;
			}
			if (cachedUser) {
				store.set(userCacheFamily(data.userId), {
					...cachedUser,
					is_online: data.isOnline
				});
			}
		};

		const handleMatchEnded = () => {
			store.set(refreshGameHistoryAtom);
		};

		const handleKodGameOver = () => {
			store.set(refreshGameHistoryAtom);
		};

		const handleGameHistoryUpdated = () => {
			store.set(refreshGameHistoryAtom);
		};

		// Chat events
		const handleMessageNew = (data: { chatId: number; channelId: string; message: MessageItem }) => {
			store.set(onNewMessageAtom, data.message);
		};

		const handleChatCreated = (data: { chatId: number; channelId: string; type: string; name?: string }) => {
			const chat: ChatListItem = {
				id: data.chatId,
				name: data.name ?? null,
				type: data.type as 'direct' | 'group',
				channel_id: data.channelId,
				created_at: new Date().toISOString(),
				lastMessageId: null,
				lastMessageContent: null,
				lastMessageType: null,
				lastMessageDate: null,
				memberIds: [],
				unreadCount: 0
			};
			store.set(onChatCreatedAtom, chat);
			socketStore.emit('chat:join', { channelId: data.channelId });
		};

		const handleMessageRead = (data: { chatId: number; messageId: number; userId: number }) => {
			store.set(onMessageReadAtom, data);
		};

		// Register listeners
		socketStore.on('invitation:received', handleInvitationReceived);
		socketStore.on('invitation:accepted', handleInvitationAccepted);
		socketStore.on('invitation:declined', handleInvitationDeclined);
		socketStore.on('invitation:cancelled', handleInvitationCancelled);
		socketStore.on('friend:removed', handleFriendRemoved);
		socketStore.on('friend:status', handleUserStatusChanged);
		socketStore.on('match:ended', handleMatchEnded);
		socketStore.on('kod:game-over', handleKodGameOver);
		socketStore.on('game-history:updated', handleGameHistoryUpdated);
		socketStore.on('message:new', handleMessageNew);
		socketStore.on('chat:created', handleChatCreated);
		socketStore.on('message:read', handleMessageRead);

		// Cleanup
		return () => {
			socketStore.off('invitation:received', handleInvitationReceived);
			socketStore.off('invitation:accepted', handleInvitationAccepted);
			socketStore.off('invitation:declined', handleInvitationDeclined);
			socketStore.off('invitation:cancelled', handleInvitationCancelled);
			socketStore.off('friend:removed', handleFriendRemoved);
			socketStore.off('friend:status', handleUserStatusChanged);
			socketStore.off('match:ended', handleMatchEnded);
			socketStore.off('kod:game-over', handleKodGameOver);
			socketStore.off('game-history:updated', handleGameHistoryUpdated);
			socketStore.off('message:new', handleMessageNew);
			socketStore.off('chat:created', handleChatCreated);
			socketStore.off('message:read', handleMessageRead);
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
	const startOnlineSession = useSetAtom(startOnlineSessionAtom);
	const stopOnlineSession = useSetAtom(stopOnlineSessionAtom);
	const [theme, setTheme] = useState<'default' | 'dark'>('dark');

	// Load token and fetch user on mount
	useEffect(() => {
		const init = async () => {
			if (apiService.isAuthenticated()) {
				await initCurrentUser();
			}
		};
		init();
	}, [initCurrentUser]);

	// Theme effect
	useEffect(() => {
		if (theme === 'dark')
			document.documentElement.setAttribute('data-theme', 'dark');
		else
			document.documentElement.removeAttribute('data-theme');
	}, [theme]);

	// Online time tracking (client-side, per user)
	useEffect(() => {
		if (!user) return;

		startOnlineSession();
		const onBeforeUnload = () => stopOnlineSession();
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', onBeforeUnload);
			stopOnlineSession();
		};
	}, [user, startOnlineSession, stopOnlineSession]);

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
				theme={theme}
				onThemeChange={setTheme}
			>
				<Routes>

					{/* Auth */}
					<Route
						path="/"
						element={<LandingPage />}
					/>

					<Route
						path="/auth"
						element={
							<PublicRoute>
								<AuthPage />
							</PublicRoute>
						}
					/>

					<Route
						path="/legal"
						element={<LegalPage />}
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
						path="/games/kingOfDiamond/:roomId/play"
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
					<Route path="/games/cardGame/result" element={
						<ProtectedRoute>
							<CardGameResult />
						</ProtectedRoute>} />

					<Route path="/games/cardGame/:roomId/result" element={
						<ProtectedRoute>
							<CardGameMultiResult />
						</ProtectedRoute>} />

					{/* Profile */}
					<Route
						path="/profile/me"
						element={
							<ProtectedRoute>
								<ProfilePage onLogout={handleLogout} />
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
						path="/messages/:chatId"
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
