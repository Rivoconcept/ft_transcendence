import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { otpService } from '../../services/otp.service';
import { userService } from '../../services';

type Context = 'confirm' | 'recover';
type Step = 'otp' | 'reset';

export default function OtpPage(): React.JSX.Element {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const email = searchParams.get('id');
	const context: Context = searchParams.get('context') === 'recover' ? 'recover' : 'confirm';

	const [step, setStep] = useState<Step>('otp');
	const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(0);
	const [expirationTimestamp, setExpirationTimestamp] = useState<number | null>(null);
	const [validatedUserId, setValidatedUserId] = useState<number | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const generatedRef = useRef(false);

	const startTimer = useCallback((expiration: string) => {
		const expMs = new Date(expiration).getTime();
		setExpirationTimestamp(expMs);
		const remaining = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
		setSecondsLeft(remaining);
	}, []);

	// Redirect to root if no email provided
	useEffect(() => {
		if (!email) {
			navigate('/', { replace: true });
		}
	}, [email, navigate]);

	// Tick the timer
	useEffect(() => {
		if (expirationTimestamp === null) return;
		timerRef.current = setInterval(() => {
			const remaining = Math.max(0, Math.floor((expirationTimestamp - Date.now()) / 1000));
			setSecondsLeft(remaining);
			if (remaining <= 0 && timerRef.current) {
				clearInterval(timerRef.current);
			}
		}, 1000);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [expirationTimestamp]);

	// Generate OTP on mount (once only)
	useEffect(() => {
		if (!email || generatedRef.current) return;
		generatedRef.current = true;
		handleGenerate();
	}, []);

	const handleGenerate = async () => {
		if (!email) return;
		setError(null);
		setCode(['', '', '', '', '', '']);
		setIsLoading(true);
		try {
			const result = await otpService.generateByEmail(email);
			startTimer(result.otp_expiration);
		} catch {
			navigate('/', { replace: true });
		} finally {
			setIsLoading(false);
			inputRefs.current[0]?.focus();
		}
	};

	const handleChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const digit = value.slice(-1);
		const newCode = [...code];
		newCode[index] = digit;
		setCode(newCode);

		if (digit && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		if (pasted.length === 0) return;
		const newCode = [...code];
		for (let i = 0; i < 6; i++) {
			newCode[i] = pasted[i] || '';
		}
		setCode(newCode);
		const focusIndex = Math.min(pasted.length, 5);
		inputRefs.current[focusIndex]?.focus();
	};

	const handleValidate = async () => {
		if (!email) return;
		const fullCode = code.join('');
		if (fullCode.length !== 6) {
			setError('Please enter the full 6-digit code');
			return;
		}

		setError(null);
		setIsLoading(true);
		try {
			const result = await otpService.validateByEmail(email, fullCode, context === 'confirm');
			if (context === 'confirm') {
				navigate('/auth', { replace: true });
			} else {
				setValidatedUserId(result.userId);
				setStep('reset');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Validation failed');
		} finally {
			setIsLoading(false);
		}
	};

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
			await userService.resetPassword(validatedUserId!, newPassword);
			navigate('/auth', { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reset password');
		} finally {
			setIsLoading(false);
		}
	};

	if (!email) return <></>;

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
				{/* Step: OTP verification */}
				{step === 'otp' && (
					<>
						<h2 className="text-center mb-2" style={{ color: 'var(--app-text-primary)' }}>
							{context === 'confirm' ? 'Verify your email' : 'Recover your account'}
						</h2>
						<p className="text-center mb-4" style={{ color: 'var(--app-text-secondary)', fontSize: 14 }}>
							We sent a 6-digit code to <strong>{email}</strong>
						</p>

						{error && (
							<div style={{
								color: '#ef4444',
								marginBottom: '1rem',
								padding: '0.5rem',
								background: '#fef2f2',
								borderRadius: 4,
								fontSize: 14,
								textAlign: 'center',
							}}>
								{error}
							</div>
						)}

						<div className="d-flex justify-content-center gap-2 mb-3" onPaste={handlePaste}>
							{code.map((digit, i) => (
								<input
									key={i}
									ref={el => { inputRefs.current[i] = el; }}
									type="text"
									inputMode="numeric"
									maxLength={1}
									value={digit}
									onChange={(e) => handleChange(i, e.target.value)}
									onKeyDown={(e) => handleKeyDown(i, e)}
									disabled={isLoading}
									style={{
										width: 44,
										height: 52,
										textAlign: 'center',
										fontSize: 22,
										fontWeight: 'bold',
										borderRadius: 8,
										border: '2px solid var(--border-color)',
										background: 'var(--bg-surface)',
										color: 'var(--app-text-primary)',
										outline: 'none',
									}}
									onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
									onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
								/>
							))}
						</div>

						{expirationTimestamp !== null && (
							<div className="text-center mb-3">
								<span style={{
									fontSize: 28,
									fontWeight: 'bold',
									color: timerColor,
									fontVariantNumeric: 'tabular-nums',
								}}>
									{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
								</span>
							</div>
						)}

						<button
							onClick={handleValidate}
							className="btn-primary w-100 mb-2"
							disabled={isLoading || code.join('').length !== 6 || isExpired}
							style={{
								padding: '0.6rem',
								borderRadius: 8,
								fontWeight: 600,
							}}
						>
							{isLoading ? 'Verifying...' : 'Verify'}
						</button>

						<button
							onClick={handleGenerate}
							className="w-100"
							disabled={isLoading}
							style={{
								padding: '0.5rem',
								borderRadius: 8,
								background: 'transparent',
								border: 'none',
								color: 'var(--primary-color)',
								cursor: 'pointer',
								fontSize: 14,
							}}
						>
							Resend code
						</button>
					</>
				)}

				{/* Step: Reset password (recover context only) */}
				{step === 'reset' && (
					<>
						<h2 className="text-center mb-2" style={{ color: 'var(--app-text-primary)' }}>
							Set new password
						</h2>
						<p className="text-center mb-4" style={{ color: 'var(--app-text-secondary)', fontSize: 14 }}>
							Enter your new password
						</p>

						{error && (
							<div style={{
								color: '#ef4444',
								marginBottom: '1rem',
								padding: '0.5rem',
								background: '#fef2f2',
								borderRadius: 4,
								fontSize: 14,
								textAlign: 'center',
							}}>
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
