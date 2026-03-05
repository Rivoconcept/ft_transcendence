import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { registerAtom, initCurrentUserAtom, logoutAtom } from '../../providers';
import { apiService } from '../../services';
import AvatarSelector from '../../components/AvatarSelector';

interface RegisterFormData {
    username: string;
    realname: string;
    password: string;
    confirmPassword: string;
    avatar: string | null;
}

export default function RegisterForm(): React.JSX.Element {
    const navigate = useNavigate();
    const register = useSetAtom(registerAtom);
    const initCurrentUser = useSetAtom(initCurrentUserAtom);
    const logout = useSetAtom(logoutAtom);
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        realname: '',
        password: '',
        confirmPassword: '',
        avatar: null
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showTerms, setShowTerms] = useState<boolean>(false);

    const handleSubmit = async (): Promise<void> => {
        if (!formData.username || !formData.realname || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await register({
                username: formData.username,
                realname: formData.realname,
                avatar: formData.avatar,
                password: formData.password
            });
            setShowTerms(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptTerms = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await initCurrentUser();
            setShowTerms(false);
            navigate('/games');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Could not complete registration. Please try again.');
            }
            setShowTerms(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeclineTerms = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await apiService.delete<void>('auth/user', {
                data: { username: formData.username }
            });
        } catch {
            // Swallow deletion errors; from the user's perspective, they declined the account.
        } finally {
            logout();
            setShowTerms(false);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') handleSubmit();
    };

    const passwordsMatch = formData.password === formData.confirmPassword;
    const showPasswordError = formData.confirmPassword.length > 0 && !passwordsMatch;

    return (
        <div>
            {error && (
                <div style={{
                    color: '#ef4444',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    background: '#fef2f2',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            <AvatarSelector
                value={formData.avatar}
                radius={100}
                onChange={(img) => setFormData({ ...formData, avatar: img })}
            />

            <div className="form-group">
                <label>Username</label>
                <input
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    onKeyUp={handleKeyPress}
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label>Real Name</label>
                <input
                    type="text"
                    placeholder="Enter your real name"
                    value={formData.realname}
                    onChange={(e) => setFormData({ ...formData, realname: e.target.value })}
                    onKeyUp={handleKeyPress}
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label>Password</label>
                <input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onKeyUp={handleKeyPress}
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label>Confirm Password</label>
                <input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onKeyUp={handleKeyPress}
                    disabled={isLoading}
                    style={showPasswordError ? { borderColor: '#ef4444' } : undefined}
                />
                {showPasswordError && (
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                        Passwords do not match
                    </span>
                )}
            </div>

            <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={isLoading || showPasswordError}
            >
                {isLoading ? 'Loading...' : 'Register'}
            </button>

            {showTerms && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#111827',
                            color: '#f9fafb',
                            padding: '1.5rem',
                            borderRadius: '0.75rem',
                            maxWidth: '600px',
                            width: '100%',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}
                    >
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Terms of Service</h2>
                        <div
                            style={{
                                maxHeight: '250px',
                                overflowY: 'auto',
                                paddingRight: '0.5rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                lineHeight: 1.5
                            }}
                        >
                            <p>
                                By creating an account and using this service, you agree to play fairly,
                                respect other players, and comply with all applicable laws and regulations.
                            </p>
                            <p>
                                You understand that your account and game data may be stored and processed
                                for the purpose of providing multiplayer features, matchmaking, and improving
                                the overall game experience.
                            </p>
                            <p>
                                You also agree not to engage in cheating, harassment, or any behavior that
                                negatively impacts other users. Violation of these terms may result in
                                suspension or termination of your account.
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={handleDeclineTerms}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#374151',
                                    color: '#e5e7eb',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Decline
                            </button>
                            <button
                                type="button"
                                onClick={handleAcceptTerms}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#10b981',
                                    color: '#ecfdf5',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                I Agree
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
