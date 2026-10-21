import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-3.5 sm:p-4 md:p-6 py-8 sm:py-12 overflow-y-auto relative font-sans safe-top safe-bottom">
            {/* Ultra Premium Background Decoratives */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -45, 0],
                        x: [0, -80, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-cyan-500/10 blur-[200px] rounded-full"
                />
                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[440px] z-10 my-auto"
            >
                <Card className="!p-5 sm:!p-8 md:!p-10 !rounded-2xl sm:!rounded-3xl md:!rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border-white/5 bg-slate-900/60 backdrop-blur-3xl">
                    <div className="text-center mb-6 sm:mb-8 md:mb-10">
                        <motion.div
                            initial={{ rotate: -15, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="inline-flex items-center justify-center p-3 sm:p-3.5 md:p-4 bg-emerald-500 rounded-2xl md:rounded-3xl mb-3 sm:mb-4 md:mb-6 shadow-2xl shadow-emerald-500/40"
                        >
                            <ShieldCheck className="text-slate-950" size={32} strokeWidth={2.5} />
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter gradient-text mb-1.5 sm:mb-2 md:mb-3 leading-tight">Daily Udhari</h1>
                        <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[1.5px] sm:tracking-[2px] md:tracking-wider">{subtitle}</p>
                    </div>

                    {children}

                    <div className="mt-8 md:mt-10 text-center border-t border-white/5 pt-6 md:pt-8">
                        <p className="text-[9px] md:text-[10px] text-slate-600 uppercase font-black tracking-[2px] md:tracking-[4px]">
                            Military Grade Encryption
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default AuthLayout;
