import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Lock, LogIn, ArrowRight, User as UserIcon } from 'lucide-react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import ApiService from '../../../services/ApiService';

interface LoginFormProps {
    onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const isEmail = identifier.includes('@');
            let formattedMobile = identifier;
            if (!isEmail) {
                const digitsOnly = identifier.replace(/\D/g, '');
                formattedMobile = digitsOnly.startsWith('91') && digitsOnly.length === 12 
                    ? `+${digitsOnly}` 
                    : `+91${digitsOnly}`;
            }

            const loginData = isEmail
                ? { email: identifier.trim(), password }
                : { mobileNumber: formattedMobile, password };

            await ApiService.login(loginData);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider mb-2"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Input
                    label="Email or Phone Number"
                    type="text"
                    placeholder="email@example.com or 10-digit mobile"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    leftIcon={<UserIcon size={18} />}
                    required
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={18} />}
                    required
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
            >
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-14"
                    rightIcon={<ArrowRight size={18} className="opacity-50" />}
                >
                    <LogIn size={20} className="mr-3" strokeWidth={3} /> Access Account
                </Button>
            </motion.div>
        </form>
    );
};

export default LoginForm;
