import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ShieldCheck, Info } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import ApiService from '../services/ApiService';

interface CreateGroupModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await ApiService.post('/groups', { name });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md z-10"
            >
                <Card className="!p-0 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-slate-900/60 backdrop-blur-3xl overflow-hidden !rounded-[2.5rem] inner-glow relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter">New Squad</h2>
                                <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-[2px]">Organize your alliance</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors border border-white/5"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-3"
                                >
                                    <Info size={16} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <Input
                                label="Squad Name"
                                placeholder="e.g. Dream Team 2024"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                                data-testid="group-name-input"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-16 !rounded-[1.5rem] shadow-2xl shadow-emerald-500/30 text-lg"
                                isLoading={isLoading}
                                leftIcon={<ShieldCheck size={22} />}
                            >
                                Initialize Squad
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>,
        document.body
    );
};

export default CreateGroupModal;
