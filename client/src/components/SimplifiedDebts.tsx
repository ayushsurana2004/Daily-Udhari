import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, RefreshCw } from 'lucide-react';
import ApiService from '../services/ApiService';

interface SimplifiedDebtsProps {
    groupId: number;
    refreshTrigger?: number;
}

interface DebtItem {
    from: { id: number; name: string };
    to: { id: number; name: string };
    amount: number;
}

const SimplifiedDebts: React.FC<SimplifiedDebtsProps> = ({ groupId, refreshTrigger }) => {
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const res = await ApiService.get(`/settlements/simplify?groupId=${groupId}`);
            setDebts(res.data);
        } catch (err) {
            console.error('Failed to fetch simplified debts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebts();
    }, [groupId, refreshTrigger]);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (loading) {
        return (
            <div className="py-6 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full mx-auto mb-3"
                />
            </div>
        );
    }

    if (debts.length === 0) {
        return (
            <div className="p-6 text-center bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <Zap size={24} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-emerald-400">All settled! No debts to simplify.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Smart Settle</h3>
                </div>
                <button
                    onClick={fetchDebts}
                    className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                    <RefreshCw size={10} /> Refresh
                </button>
            </div>

            <p className="text-[10px] text-slate-500 font-bold mb-3">
                Instead of {debts.length > 1 ? 'multiple payments' : 'separate payments'}, just {debts.length} transfer{debts.length !== 1 ? 's' : ''} needed:
            </p>

            {debts.map((debt, index) => {
                const isMe = debt.from.id === currentUser.id;
                return (
                    <motion.div
                        key={`${debt.from.id}-${debt.to.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-2xl border transition-all ${isMe
                            ? 'bg-rose-500/5 border-rose-500/15'
                            : 'bg-slate-950/30 border-white/5'
                            }`}
                    >
                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 ${isMe ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {debt.from.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] md:text-xs font-bold text-slate-300 truncate">
                                {isMe ? 'You' : debt.from.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                            <ArrowRight size={14} className="text-amber-400" />
                            <span className="text-xs md:text-sm font-black text-amber-400 whitespace-nowrap">₹{debt.amount.toFixed(2)}</span>
                            <ArrowRight size={14} className="text-amber-400 hidden sm:block" />
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                            <p className="text-[10px] md:text-xs font-bold text-slate-300 truncate">
                                {debt.to.id === currentUser.id ? 'You' : debt.to.name}
                            </p>
                        </div>

                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 ${debt.to.id === currentUser.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {debt.to.name.substring(0, 2).toUpperCase()}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SimplifiedDebts;
