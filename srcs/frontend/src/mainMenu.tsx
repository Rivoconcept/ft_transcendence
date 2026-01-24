import React, { useState, type JSX } from 'react';
import { Menu, User, Dice1, Hash, LogOut, TurkishLira } from 'lucide-react';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"

// Types
// type Page = 'login' | 'profile' | 'gameList' | 'diceGame' | 'numberGame';
type Page = 'login' | 'profile' | 'gameList' | 'diceGame' | 'numberGame' | 'statusScreen' | 'winnerScreen';
type GameId = 'diceGame' | 'numberGame';

interface NavigationProps {
	currentPage: Page;
	navigate: (page: Page) => void;
	username: string;
	onLogout: () => void;
	theme: 'default' | 'neon' | 'dark';
	onThemeChange: (theme: 'default' | 'neon' | 'dark') => void;
}

interface AuthPageProps {
	onLogin: (username: string) => void;
}

interface ProfilePageProps {
	username: string;
}

interface GameListProps {
	onStartGame: (gameId: GameId) => void;
}

interface GameProps {
	onBack: () => void;
}

interface FormData {
	username: string;
	password: string;
}

interface Game {
	id: GameId;
	name: string;
	description: string;
	icon: React.ReactNode;
}

// Main App Component with Routing
export default function App(): JSX.Element {

	/************** CHANGE THIS IN PROD **************/
	// const [currentPage, setCurrentPage] = useState<Page>('login');
	const [currentPage, setCurrentPage] = useState<Page>('login');

	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [username, setUsername] = useState<string>('');
	const [currentGame, setCurrentGame] = useState<GameId | null>(null);
	const [theme, setTheme] = useState<'default' | 'neon' | 'dark'>('default');

	React.useEffect(() => {
		if (theme === 'neon')
			document.documentElement.setAttribute('data-theme', 'neon');
		else if (theme === 'dark')
			document.documentElement.setAttribute('data-theme', 'dark');
		else
			document.documentElement.removeAttribute('data-theme');
	}, [theme]);

	const navigate = (page: Page): void => {
		setCurrentPage(page);
	};

	const handleLogin = (user: string): void => {
		setUsername(user);
		setIsLoggedIn(true);
		navigate('gameList');
	};

	const handleLogout = (): void => {
		setIsLoggedIn(false);
		setUsername('');
		navigate('login');
	};

	const startGame = (game: GameId): void => {
		setCurrentGame(game);
		navigate(game);
	};

	return (
		<div className="app">
			{isLoggedIn && (
				<Navigation
					currentPage={currentPage}
					navigate={navigate}
					username={username}
					onLogout={handleLogout}
					theme={theme}
					onThemeChange={setTheme}
				/>
			)}

			<main className="main-content">
				{currentPage === 'login' && <AuthPage onLogin={handleLogin} />}
				{currentPage === 'profile' && <ProfilePage username={username} />}
				{currentPage === 'gameList' && <GameList onStartGame={startGame} />}
				{currentPage === 'diceGame' && <DiceGame onBack={() => navigate('gameList')} />}
				{currentPage === 'numberGame' && <NumberGame onBack={() => navigate('gameList')} />}
				{currentPage === 'statusScreen' && <StatusScreen />}
				{currentPage === 'winnerScreen' && <WinnerScreen />}
			</main>
		</div>
	);
}

// Navigation Component
function Navigation({ currentPage, navigate, username, onLogout, theme, onThemeChange }: NavigationProps): JSX.Element {
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
				<button
					className={`nav-link ${currentPage === 'gameList' ? 'active' : ''}`}
					onClick={() => navigate('gameList')}
				>
					Games
				</button>
				<button
					className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
					onClick={() => navigate('profile')}
				>
					<User size={18} />
					{username}
				</button>
				<button className="logout-btn" onClick={onLogout}>
					<LogOut size={18} />
					Logout
				</button>
			</div>
		</nav>
	);
}

// Authentication Page
function AuthPage({ onLogin }: AuthPageProps): JSX.Element {
	const [isLogin, setIsLogin] = useState<boolean>(true);
	const [formData, setFormData] = useState<FormData>({ username: '', password: '' });

	const handleSubmit = (): void => {
		if (formData.username)
			onLogin(formData.username);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === 'Enter')
			handleSubmit();
	};

	return (
		<div className="auth-container">
			<div className="auth-tabs">
				<button
					className={`tab-btn ${isLogin ? 'active' : ''}`}
					onClick={() => setIsLogin(true)}
				>
					Login
				</button>
				<button
					className={`tab-btn ${!isLogin ? 'active' : ''}`}
					onClick={() => setIsLogin(false)}
				>
					Register
				</button>
			</div>

			<div>
				<div className="form-group">
					<label>{isLogin ? 'Username or Email' : 'Username'}</label>
					<input
						type="text"
						placeholder="Enter username"
						value={formData.username}
						onChange={(e) => setFormData({ ...formData, username: e.target.value })}
						onKeyPress={handleKeyPress}
					/>
				</div>

				{!isLogin && (
					<div className="form-group">
						<label>Email</label>
						<input type="email" placeholder="Enter email" onKeyPress={handleKeyPress} />
					</div>
				)}

				<div className="form-group">
					<label>Password</label>
					<input
						type="password"
						placeholder="Enter password"
						value={formData.password}
						onChange={(e) => setFormData({ ...formData, password: e.target.value })}
						onKeyPress={handleKeyPress}
					/>
				</div>

				<button onClick={handleSubmit} className="btn-primary">
					{isLogin ? 'Login' : 'Register'}
				</button>
			</div>
		</div>
	);
}

// Profile Page
function ProfilePage({ username }: ProfilePageProps): JSX.Element {
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

// Game List
function GameList({ onStartGame }: GameListProps): JSX.Element {
	const games: Game[] = [
		{
			id: 'diceGame',
			name: 'Dice Game',
			description: 'Roll three dice and test your luck! Get the highest score possible.',
			icon: '🎲'
		},
		{
			id: 'numberGame',
			name: 'Number Selection',
			description: 'Pick a number between 1 and 100. Choose wisely!',
			icon: '#️⃣'
		}
	];

	return (
		<div className="game-list">
			{games.map(game => (
				<div key={game.id} className="game-card">
					<div className="game-icon">{game.icon}</div>
					<h3>{game.name}</h3>
					<p>{game.description}</p>
					<button className="btn-primary" onClick={() => onStartGame(game.id)}>
						Play Now
					</button>
				</div>
			))}
		</div>
	);
}

// Dice Game
function DiceGame({ onBack }: GameProps): JSX.Element {
	const [dice, setDice] = useState<number[]>([1, 1, 1]);
	const [isRolling, setIsRolling] = useState<boolean>(false);
	const [showResult, setShowResult] = useState<boolean>(false);

	const rollDice = (): void => {
		setIsRolling(true);
		setShowResult(false);

		setTimeout(() => {
			const newDice: number[] = [
				Math.floor(Math.random() * 6) + 1,
				Math.floor(Math.random() * 6) + 1,
				Math.floor(Math.random() * 6) + 1
			];
			setDice(newDice);
			setIsRolling(false);
			setShowResult(true);
		}, 500);
	};

	const total: number = dice.reduce((a, b) => a + b, 0);

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>Dice Game</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			<div className="dice-container">
				{dice.map((value, index) => (
					<div key={index} className="dice">
						{value}
					</div>
				))}
			</div>

			{showResult && (
				<div className="result-card">
					<h3>Total Score</h3>
					<p>{total}</p>
				</div>
			)}

			<button
				className="roll-btn"
				onClick={rollDice}
				disabled={isRolling}
			>
				{isRolling ? 'Rolling...' : 'Roll Dice'}
			</button>
		</div>
	);
}

// Number Selection Game
function NumberGame({ onBack }: GameProps): JSX.Element {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState<boolean>(false);

	const handleSubmit = (): void => {
		if (selectedNumber !== null) {
			setSubmitted(true);
		}
	};

	const handlePlayAgain = (): void => {
		setSubmitted(false);
		setSelectedNumber(null);
	};

	const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

	return (
		<div className="game-container">
			<div className="game-header">
				<h2>Number Selection Game</h2>
				<button className="back-btn" onClick={onBack}>Back</button>
			</div>

			{!submitted ? (
				<>
					<div className="number-input-container">
						<label>Select a number between 1 and 100:</label>
						<div className="number-grid">
							{numbers.map((num) => (
								<button
									key={num}
									className={`number-btn ${selectedNumber === num ? 'selected' : ''}`}
									onClick={() => setSelectedNumber(num)}
								>
									{num}
								</button>
							))}
						</div>
					</div>

					{selectedNumber !== null && (
						<div className="number-display">
							{selectedNumber}
						</div>
					)}

					<button
						className="btn-primary"
						onClick={handleSubmit}
						disabled={selectedNumber === null}
					>
						Submit Number
					</button>
				</>
			) : (
				<div className="game-over-container">
					<h2>Number Submitted!</h2>
					<p>You selected: <strong>{selectedNumber}</strong></p>
					<div className="button-group">
						<button className="btn-primary" onClick={handlePlayAgain}>
							Play Again
						</button>
						<button className="back-btn" onClick={onBack}>
							Back to Games
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function StatusScreen() {
	const Players = [
		{
			id: 'diceGame',
			img: 'default.png',
			point: '8',
			value: '15',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '5',
			value: '34',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '9',
			value: '12',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '2',
			value: '5',
			winner: Math.random() > 0.5
		},
		{
			id: 'numberGame',
			img: 'default.png',
			point: '3',
			value: '5',
			winner: Math.random() > 0.5
		}
	];

	let totalPoints = Players.map(player => player.point).reduce((a, b) => Number(a) + Number(b), 0);
	let average = totalPoints / Players.length;
	let target = average * 0.8;

	return (
		<div className="result-card">
			<div className="player-list">
				{Players.map(player => (
					<div key={player.id} className={`${player.winner ? 'player-card-winner' : 'player-card-loser'}`}>
						<div className="player-point">pt : {player.point}</div>
						<div>{`${player.winner ? '👑' : ''}`}</div>
						<img
							className="player-avatar"
							src={new URL(`./images/${player.img}`, import.meta.url).href}
							alt={player.img}
						/>
						<div className="player-value">{player.value}</div>
					</div>
				))}
			</div>
			<div className="status-summary">
				<p>total points		: {totalPoints}</p>
				<p>average points	: {average}</p>
				<p>target points	: {average} x 0.8  = {target}</p>
			</div>
		</div>
	);
}

function WinnerScreen() {
	const Players = [
		{
			id: 'diceGame',
			img: 'default.png',
			point: '8',
			value: '15',
			winner: true
		}
	];

	return (
		<div>
			<div className="player-list">
				{Players.map(player => (
					<div key={player.id} className={`${player.winner ? 'player-card-winner' : 'player-card-loser'}`}>
						<div className="player-point">pt : {player.point}</div>
						<div>{`${player.winner ? '👑' : ''}`}</div>
						<img
							className="player-avatar"
							src={new URL(`./images/${player.img}`, import.meta.url).href}
							alt={player.img}
						/>
						<div className="player-value">{player.value}</div>
					</div>
				))}
			</div>
		</div>
	);
}