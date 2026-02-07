import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { registerAtom } from '../../providers';
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
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        realname: '',
        password: '',
        confirmPassword: '',
        avatar: null
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (): Promise<void> => {
        // Validate required fields
        if (!formData.username || !formData.realname || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        // Validate password confirmation
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
            navigate('/games');
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
        </div>
    );
}
