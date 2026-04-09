import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';

interface FoundUser {
	id: number;
	username: string;
	email: string;
	avatar: string;
}

export default function ForgotPasswordPage(): React.JSX.Element {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [foundUser, setFoundUser] = useState<FoundUser | null>(null);

	const handleSubmit = async () => {
		if (!email.trim()) {
			setError('Please enter your email');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			setError('Please enter a valid email address');
			return;
		}

		setError(null);
		setFoundUser(null);
		setIsLoading(true);
		try {
			const user = await userService.checkEmail(email.trim());
			setFoundUser(user);
		} catch {
			setError('No account found with this email address');
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmAccount = () => {
		if (foundUser) {
			navigate(`/verify?id=${encodeURIComponent(foundUser.email)}&context=recover`);
		}
	};

	return (
		<div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
			<div style={{
				background: 'var(--bg-surface)',
				borderRadius: 12,
				padding: '2rem',
				maxWidth: 400,
				width: '100%',
				boxShadow: '0 4px 20px var(--shadow-md)',
			}}>
				<h2 className="text-center mb-2" style={{ color: 'var(--app-text-primary)' }}>
					Recover your account
				</h2>
				<p className="text-center mb-4" style={{ color: 'var(--app-text-secondary)', fontSize: 14 }}>
					Enter your email to find your account
				</p>

				{error && (
					<div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: 4, fontSize: 14, textAlign: 'center' }}>
						{error}
					</div>
				)}

				<div className="form-group mb-3">
					<input
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => { setEmail(e.target.value); setFoundUser(null); }}
						onKeyUp={(e) => { if (e.key === 'Enter') handleSubmit(); }}
						disabled={isLoading}
						style={{
							width: '100%',
							padding: '0.6rem',
							borderRadius: 8,
							border: '2px solid var(--border-color)',
							background: 'var(--bg-surface)',
							color: 'var(--app-text-primary)',
						}}
					/>
				</div>

				<button
					className="btn-primary w-100 mb-2"
					onClick={handleSubmit}
					disabled={!email.trim() || isLoading}
					style={{ padding: '0.6rem', borderRadius: 8, fontWeight: 600 }}
				>
					{isLoading ? 'Searching...' : 'Search'}
				</button>

				{foundUser && (
					<div style={{
						marginTop: '1rem',
						padding: '1rem',
						borderRadius: 8,
						border: '1px solid var(--border-color)',
						background: 'var(--bg-surface)',
					}}>
						<div className="d-flex align-items-center gap-3 mb-3">
							<div style={{
								width: 56,
								height: 56,
								borderRadius: '50%',
								overflow: 'hidden',
								flexShrink: 0,
								background: 'var(--border-color)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
								{foundUser.avatar ? (
									<img
										src={foundUser.avatar}
										alt={foundUser.username}
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									/>
								) : (
									<span style={{ fontSize: 22, fontWeight: 'bold', color: 'var(--app-text-secondary)' }}>
										{foundUser.username.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
							<div>
								<div style={{ fontWeight: 600, color: 'var(--app-text-primary)', fontSize: 16 }}>
									{foundUser.username}
								</div>
								<div style={{ color: 'var(--app-text-secondary)', fontSize: 13 }}>
									{foundUser.email}
								</div>
							</div>
						</div>

						<button
							className="btn-primary w-100"
							onClick={handleConfirmAccount}
							style={{ padding: '0.6rem', borderRadius: 8, fontWeight: 600 }}
						>
							This is my account
						</button>
					</div>
				)}

				<button
					className="w-100"
					onClick={() => navigate('/auth')}
					style={{ padding: '0.5rem', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: 14, marginTop: '0.5rem' }}
				>
					Back to login
				</button>
			</div>
		</div>
	);
}
