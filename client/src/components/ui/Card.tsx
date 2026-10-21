import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -4, borderColor: 'rgba(16, 185, 129, 0.2)' } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl overflow-hidden ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default Card;
