import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage(): React.JSX.Element {
    const location = useLocation();
    const fromState = (location.state as { openRegister?: boolean } | null)?.openRegister;
    const [isLogin, setIsLogin] = useState<boolean>(fromState ? false : true);

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
