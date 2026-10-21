import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/5',
        outline: 'border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400',
        ghost: 'text-slate-400 hover:text-slate-100 hover:bg-white/5',
        danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl min-h-[44px]',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...(props as any)}
        >
            {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {!isLoading && leftIcon && <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">{leftIcon}</span>}
            <span className="relative z-10">{children}</span>
            {!isLoading && rightIcon && <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">{rightIcon}</span>}
        </motion.button>
    );
};

export default Button;
