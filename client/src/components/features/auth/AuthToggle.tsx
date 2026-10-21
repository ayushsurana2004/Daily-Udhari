import React from 'react';
import { motion } from 'framer-motion';

interface AuthToggleProps {
    isLogin: boolean;
    onToggle: (isLogin: boolean) => void;
}

const AuthToggle: React.FC<AuthToggleProps> = ({ isLogin, onToggle }) => {
    return (
        <div className="flex bg-slate-950/40 p-1.5 rounded-2xl mb-10 border border-white/5 relative">
            <motion.div
                initial={false}
                animate={{ x: isLogin ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-1.5 left-1.5 bottom-1.5 w-[calc(50%-6px)] bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20"
            />
            <button
                onClick={() => onToggle(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-[2px] transition-all duration-500 relative z-10 ${isLogin ? 'text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Sign In
            </button>
            <button
                onClick={() => onToggle(false)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-[2px] transition-all duration-500 relative z-10 ${!isLogin ? 'text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Register
            </button>
        </div>
    );
};

export default AuthToggle;
