import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, LogOut, AlertTriangle, CheckCircle, ShieldAlert, 
    ArrowDownLeft, ArrowUpRight, Loader2, Key 
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import ApiService from '../services/ApiService';

interface ExitGroupModalProps {
    groupId: number;
    groupName: string;
    onClose: () => void;
    onSuccess: () => void;
    onOpenSettleModal?: () => void;
}

const ExitGroupModal: React.FC<ExitGroupModalProps> = ({
    groupId,
    groupName,
    onClose,
    onSuccess,
    onOpenSettleModal
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [error, setError] = useState('');
    const [balances, setBalances] = useState({ youOwe: 0, youAreOwed: 0, totalBalance: 0 });

    useEffect(() => {
        const fetchGroupBalance = async () => {
            setIsLoading(true);
            try {
                const res = await ApiService.get(`/balances?groupId=${groupId}`);
                setBalances({
                    youOwe: Number(res.data?.youOwe) || 0,
                    youAreOwed: Number(res.data?.youAreOwed) || 0,
                    totalBalance: Number(res.data?.totalBalance) || 0
                });
            } catch (err: any) {
                console.error('Failed to fetch group balances:', err);
                setError('Could not verify group balances.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroupBalance();
    }, [groupId]);

    const hasActiveDebts = balances.youOwe > 0.001 || balances.youAreOwed > 0.001;

    const handleExit = async () => {
        if (hasActiveDebts) return;

        setIsExiting(true);
        setError('');

        try {
            await ApiService.post(`/groups/${groupId}/exit`);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to exit group.');
        } finally {
            setIsExiting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative z-10 w-full max-w-md my-auto"
            >
                <Card className="!p-0 !rounded-2xl sm:!rounded-[2rem] shadow-2xl shadow-rose-500/10 border-rose-500/20 bg-slate-900/95 backdrop-blur-2xl overflow-hidden max-h-[92vh] flex flex-col">
                    {/* Header */}
                    <div className="p-4 sm:p-6 md:p-8 pb-3 sm:pb-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-rose-600 to-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-xl shadow-rose-500/30 shrink-0">
                                <LogOut size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Exit Squad</h3>
                                <p className="text-[9px] sm:text-[10px] text-rose-400 font-black uppercase tracking-[2px]">{groupName}</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
                        >
                            <X size={18} className="sm:w-5 sm:h-5" />
                        </motion.button>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-start gap-3"
                            >
                                <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 size={28} className="animate-spin text-rose-400" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verifying squad debts...</p>
                            </div>
                        ) : (
                            <>
                                {/* Balance Status Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[2px] text-slate-500 px-1">
                                        <span>Your Group Settlement Status</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-4 rounded-2xl border ${balances.youOwe > 0.001 ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/5 text-slate-400'}`}>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                                                <ArrowDownLeft size={14} className={balances.youOwe > 0.001 ? 'text-rose-400' : 'text-slate-500'} />
                                                <span>You Owe</span>
                                            </div>
                                            <p className={`text-xl font-black ${balances.youOwe > 0.001 ? 'text-rose-400' : 'text-slate-300'}`}>
                                                ₹{balances.youOwe.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className={`p-4 rounded-2xl border ${balances.youAreOwed > 0.001 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/[0.03] border-white/5 text-slate-400'}`}>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                                                <ArrowUpRight size={14} className={balances.youAreOwed > 0.001 ? 'text-cyan-400' : 'text-slate-500'} />
                                                <span>You Are Owed</span>
                                            </div>
                                            <p className={`text-xl font-black ${balances.youAreOwed > 0.001 ? 'text-cyan-400' : 'text-slate-300'}`}>
                                                ₹{balances.youAreOwed.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rule Explanation / Status */}
                                {hasActiveDebts ? (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                            <ShieldAlert size={16} />
                                            <span>Unsettled Balances Detected</span>
                                        </div>
                                        <p className="text-[12px] text-amber-200/90 leading-relaxed font-medium">
                                            You can only exit <strong>{groupName}</strong> once all debts are completely settled (both You Owe and You Are Owed must be ₹0.00).
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                            <CheckCircle size={16} />
                                            <span>All Clear to Leave</span>
                                        </div>
                                        <p className="text-[12px] text-emerald-200/90 leading-relaxed font-medium">
                                            You do not owe or have any pending claims in this squad. You can safely exit.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-2">
                                    {hasActiveDebts ? (
                                        <>
                                            {onOpenSettleModal && (
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        onOpenSettleModal();
                                                    }}
                                                    leftIcon={<Key size={16} />}
                                                    className="w-full h-12 !rounded-xl !bg-emerald-500 hover:!bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                                                >
                                                    Settle Up With Squad First
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled
                                                className="w-full h-12 !rounded-xl opacity-40 cursor-not-allowed border-white/5 text-slate-500 font-bold text-xs uppercase tracking-wider"
                                            >
                                                Exit Squad (Disabled - Clear Balances First)
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleExit}
                                            isLoading={isExiting}
                                            leftIcon={<LogOut size={16} />}
                                            className="w-full h-12 !rounded-xl !bg-rose-500 hover:!bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/30"
                                        >
                                            {isExiting ? 'Leaving Squad...' : 'Confirm & Exit Squad'}
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>,
        document.body
    );
};

export default ExitGroupModal;
