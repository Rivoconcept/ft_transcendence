import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { otpService } from '../../services/otp.service';
import { userService } from '../../services';
import AvatarUtil from '../../components/AvatarUtil';

type Step = 'email' | 'otp' | 'reset';

interface FoundUser {
	id: number;
	username: string;
	avatar: string;
}

export default function ForgotPasswordPage(): React.JSX.Element {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>('email');
	const [email, setEmail] = useState('');
	const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
	const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
	const [otpValidated, setOtpValidated] = useState(false);
	const [validatedCode, setValidatedCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(0);
	const [expirationTimestamp, setExpirationTimestamp] = useState<number | null>(null);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Timer tick
	useEffect(() => {
		if (expirationTimestamp === null) return;
		timerRef.current = setInterval(() => {
			const remaining = Math.max(0, Math.floor((expirationTimestamp - Date.now()) / 1000));
			setSecondsLeft(remaining);
			if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
		}, 1000);
		return () => { if (timerRef.current) clearInterval(timerRef.current); };
	}, [expirationTimestamp]);

	// Step 1: Search account by email
	const handleSearchEmail = async () => {
		if (!email.trim()) {
			setError('Please enter your email');
			return;
		}
		setError(null);
		setIsLoading(true);
		try {
			const result = await otpService.generateByEmail(email.trim());
			setFoundUser(result.user);
			const expMs = new Date(result.otp_expiration).getTime();
			setExpirationTimestamp(expMs);
			setSecondsLeft(Math.max(0, Math.floor((expMs - Date.now()) / 1000)));
			setStep('otp');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Account not found');
		} finally {
			setIsLoading(false);
		}
	};

	// Resend OTP
	const handleResend = async () => {
		setError(null);
		setCode(['', '', '', '', '', '']);
		setIsLoading(true);
		try {
			const result = await otpService.generateByEmail(email.trim());
			const expMs = new Date(result.otp_expiration).getTime();
			setExpirationTimestamp(expMs);
			setSecondsLeft(Math.max(0, Math.floor((expMs - Date.now()) / 1000)));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to resend code');
		} finally {
			setIsLoading(false);
			inputRefs.current[0]?.focus();
		}
	};

	// OTP input handlers
	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const digit = value.slice(-1);
		const newCode = [...code];
		newCode[index] = digit;
		setCode(newCode);
		if (digit && index < 5) inputRefs.current[index + 1]?.focus();
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handleOtpPaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		if (!pasted.length) return;
		const newCode = [...code];
		for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || '';
		setCode(newCode);
		inputRefs.current[Math.min(pasted.length, 5)]?.focus();
	};

	// Step 2: Validate OTP
	const handleValidateOtp = async () => {
		const fullCode = code.join('');
		if (fullCode.length !== 6) {
			setError('Please enter the full 6-digit code');
			return;
		}
		setError(null);
		setIsLoading(true);
		try {
			await otpService.validateByEmail(email.trim(), fullCode);
			setValidatedCode(fullCode);
			setOtpValidated(true);
			setStep('reset');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Invalid code');
		} finally {
			setIsLoading(false);
		}
	};

	// Step 3: Reset password
	const handleResetPassword = async () => {
		if (!newPassword || !confirmPassword) {
			setError('Please fill in both fields');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}
		if (newPassword.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}
		setError(null);
		setIsLoading(true);
		try {
			await userService.resetPassword(foundUser!.id, newPassword);
			navigate('/auth');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reset password');
		} finally {
			setIsLoading(false);
		}
	};

	const isExpired = secondsLeft <= 0 && expirationTimestamp !== null;
	const timerColor = secondsLeft <= 5 ? '#ef4444' : 'var(--primary-color, #667eea)';
	const passwordsMatch = newPassword === confirmPassword;
	const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

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
				{/* Step 1: Email */}
				{step === 'email' && (
					<>
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
								onChange={(e) => setEmail(e.target.value)}
								onKeyUp={(e) => { if (e.key === 'Enter') handleSearchEmail(); }}
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
							onClick={handleSearchEmail}
							disabled={isLoading || !email.trim()}
							style={{ padding: '0.6rem', borderRadius: 8, fontWeight: 600 }}
						>
							{isLoading ? 'Searching...' : 'Search'}
						</button>

						<button
							className="w-100"
							onClick={() => navigate('/auth')}
							style={{ padding: '0.5rem', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: 14 }}
						>
							Back to login
						</button>
					</>
				)}

				{/* Step 2: OTP verification */}
				{step === 'otp' && foundUser && (
					<>
						<div className="text-center mb-3">
							<div className="d-flex justify-content-center mb-2">
								<AvatarUtil id={foundUser.id} radius={64} showStatus={false} />
							</div>
							<h5 style={{ color: 'var(--app-text-primary)' }}>{foundUser.username}</h5>
							<p style={{ color: 'var(--app-text-secondary)', fontSize: 14 }}>
								If this is your account, enter the code sent to your email
							</p>
						</div>

						{error && (
							<div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: 4, fontSize: 14, textAlign: 'center' }}>
								{error}
							</div>
						)}

						<div className="d-flex justify-content-center gap-2 mb-3" onPaste={handleOtpPaste}>
							{code.map((digit, i) => (
								<input
									key={i}
									ref={el => { inputRefs.current[i] = el; }}
									type="text"
									inputMode="numeric"
									maxLength={1}
									value={digit}
									onChange={(e) => handleOtpChange(i, e.target.value)}
									onKeyDown={(e) => handleOtpKeyDown(i, e)}
									disabled={isLoading || otpValidated}
									style={{
										width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 'bold',
										borderRadius: 8, border: '2px solid var(--border-color)', background: 'var(--bg-surface)',
										color: 'var(--app-text-primary)', outline: 'none',
									}}
									onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
									onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
								/>
							))}
						</div>

						{expirationTimestamp !== null && !otpValidated && (
							<div className="text-center mb-3">
								<span style={{ fontSize: 28, fontWeight: 'bold', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
									{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
								</span>
							</div>
						)}

						{!otpValidated && (
							<>
								<button
									className="btn-primary w-100 mb-2"
									onClick={handleValidateOtp}
									disabled={isLoading || code.join('').length !== 6 || isExpired}
									style={{ padding: '0.6rem', borderRadius: 8, fontWeight: 600 }}
								>
									{isLoading ? 'Verifying...' : 'Verify'}
								</button>

								<button
									className="w-100"
									onClick={handleResend}
									disabled={isLoading}
									style={{ padding: '0.5rem', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: 14 }}
								>
									Resend code
								</button>
							</>
						)}
					</>
				)}

				{/* Step 3: New password */}
				{step === 'reset' && (
					<>
						<h2 className="text-center mb-2" style={{ color: 'var(--app-text-primary)' }}>
							Set new password
						</h2>
						<p className="text-center mb-4" style={{ color: 'var(--app-text-secondary)', fontSize: 14 }}>
							Enter your new password
						</p>

						{error && (
							<div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: 4, fontSize: 14, textAlign: 'center' }}>
								{error}
							</div>
						)}

						<div className="form-group mb-3">
							<label style={{ color: 'var(--app-text-primary)', fontSize: 14, marginBottom: 4, display: 'block' }}>New Password</label>
							<input
								type="password"
								placeholder="Enter new password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								onKeyUp={(e) => { if (e.key === 'Enter') handleResetPassword(); }}
								disabled={isLoading}
								style={{
									width: '100%', padding: '0.6rem', borderRadius: 8,
									border: '2px solid var(--border-color)', background: 'var(--bg-surface)',
									color: 'var(--app-text-primary)',
								}}
							/>
						</div>

						<div className="form-group mb-3">
							<label style={{ color: 'var(--app-text-primary)', fontSize: 14, marginBottom: 4, display: 'block' }}>Confirm Password</label>
							<input
								type="password"
								placeholder="Confirm new password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								onKeyUp={(e) => { if (e.key === 'Enter') handleResetPassword(); }}
								disabled={isLoading}
								style={{
									width: '100%', padding: '0.6rem', borderRadius: 8,
									border: `2px solid ${showMismatch ? '#ef4444' : 'var(--border-color)'}`,
									background: 'var(--bg-surface)', color: 'var(--app-text-primary)',
								}}
							/>
							{showMismatch && (
								<span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
									Passwords do not match
								</span>
							)}
						</div>

						<button
							className="btn-primary w-100"
							onClick={handleResetPassword}
							disabled={isLoading || showMismatch || !newPassword || !confirmPassword}
							style={{ padding: '0.6rem', borderRadius: 8, fontWeight: 600 }}
						>
							{isLoading ? 'Saving...' : 'Save new password'}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
