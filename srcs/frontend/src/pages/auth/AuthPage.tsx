import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { loginAtom, registerAtom } from '../../providers';

interface FormData {
	username: string;
	realname: string;
	password: string;
}

export default function AuthPage(): React.JSX.Element {
	const navigate = useNavigate();
	const login = useSetAtom(loginAtom);
	const register = useSetAtom(registerAtom);
	const [isLogin, setIsLogin] = useState<boolean>(true);
	const [formData, setFormData] = useState<FormData>({ username: '', realname: '', password: '' });
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleSubmit = async (): Promise<void> => {
		if (!formData.username || !formData.password) {
			setError('Please fill in all required fields');
			return;
		}

		setError(null);
		setIsLoading(true);

		try {
			if (isLogin) {
				await login({
					username: formData.username,
					password: formData.password
				});
			} else {
				if (!formData.realname) {
					setError('Please enter your real name');
					setIsLoading(false);
					return;
				}
				await register({
					username: formData.username,
					realname: formData.realname,
					avatar: formData.username.charAt(0).toUpperCase(),
					password: formData.password
				});
			}
			navigate('/games');
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError(isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
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
					onClick={() => { setIsLogin(true); setError(null); }}
				>
					Login
				</button>
				<button
					className={`tab-btn ${!isLogin ? 'active' : ''}`}
					onClick={() => { setIsLogin(false); setError(null); }}
				>
					Register
				</button>
			</div>

			<div>
				{error && (
					<div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px' }}>
						{error}
					</div>
				)}

				<div className="form-group">
					<label>Username</label>
					<input
						type="text"
						placeholder="Enter username"
						value={formData.username}
						onChange={(e) => setFormData({ ...formData, username: e.target.value })}
						onKeyPress={handleKeyPress}
						disabled={isLoading}
					/>
				</div>

				{!isLogin && (
					<div className="form-group">
						<label>Real Name</label>
						<input
							type="text"
							placeholder="Enter your real name"
							value={formData.realname}
							onChange={(e) => setFormData({ ...formData, realname: e.target.value })}
							onKeyPress={handleKeyPress}
							disabled={isLoading}
						/>
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
						disabled={isLoading}
					/>
				</div>

				<button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
					{isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
				</button>
			</div>
		</div>
	);
}
