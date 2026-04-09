import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { loginAtom } from '../../providers';

interface LoginFormData {
    username: string;
    password: string;
}

export default function LoginForm(): React.JSX.Element {
    const navigate = useNavigate();
    const login = useSetAtom(loginAtom);
    const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (): Promise<void> => {
        if (!formData.username || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const user = await login({
                username: formData.username,
                password: formData.password
            });
            if (user.is_confirmed) {
                navigate('/games');
            } else {
                navigate(`/verify?id=${encodeURIComponent(user.email)}`);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') handleSubmit();
    };

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

            <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Login'}
            </button>

            <div className="text-center mt-3">
                <a
                    href="/forgot-password"
                    onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                    style={{ color: 'var(--primary-color, #667eea)', fontSize: 14, textDecoration: 'none' }}
                >
                    I forgot my password
                </a>
            </div>
        </div>
    );
}
