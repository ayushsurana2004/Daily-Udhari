import React, { useState } from 'react';
import AuthLayout from '../layouts/AuthLayout';
import AuthToggle from '../components/features/auth/AuthToggle';
import LoginForm from '../components/features/auth/LoginForm';
import RegisterForm from '../components/features/auth/RegisterForm';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <AuthLayout
            title="Daily Udhari"
            subtitle={isLogin ? "Welcome back! Let's settle up." : "Start splitting expenses with ease."}
        >
            <AuthToggle isLogin={isLogin} onToggle={(val) => setIsLogin(val)} />

            {isLogin ? (
                <LoginForm onSuccess={onLoginSuccess} />
            ) : (
                <RegisterForm onSuccess={onLoginSuccess} />
            )}

            <div className="mt-8 text-center">
                <p className="text-xs text-slate-500">
                    By continuing, you agree to our <span className="text-slate-400 font-medium hover:underline cursor-pointer">Terms</span> and <span className="text-slate-400 font-medium hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
