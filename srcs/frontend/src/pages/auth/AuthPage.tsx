import React, { useState } from 'react';

interface AuthPageProps {
	onLogin: (username: string) => void;
}

interface FormData {
	username: string;
	password: string;
}

export default function AuthPage({ onLogin }: AuthPageProps): React.JSX.Element {
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
