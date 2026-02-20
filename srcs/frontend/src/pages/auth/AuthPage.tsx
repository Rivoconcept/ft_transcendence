import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage(): React.JSX.Element {
    const [isLogin, setIsLogin] = useState<boolean>(true);

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

            {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
    );
}
