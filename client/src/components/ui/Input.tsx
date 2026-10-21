import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2 w-full group">
            {label && (
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] ml-1 group-focus-within:text-emerald-500 transition-colors">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                        {leftIcon}
                    </div>
                )}
                <input
                    className={cn(
                        'w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 transition-all duration-300 outline-none',
                        'placeholder:text-slate-700 font-medium text-slate-100',
                        'focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-slate-900/50',
                        leftIcon ? 'pl-20' : 'pl-6',
                        rightIcon ? 'pr-14' : 'pr-6',
                        error ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/50' : '',
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider ml-1 italic animate-in slide-in-from-left-2 transition-all">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
