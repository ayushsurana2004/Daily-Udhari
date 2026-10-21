import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Wallet, Info } from 'lucide-react';
import ApiService from '../services/ApiService';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

interface SettlementModalProps {
    onClose: () => void;
    groupId?: number;
}

const SettlementModal: React.FC<SettlementModalProps> = ({ onClose, groupId }) => {
    const [amount, setAmount] = useState('');
    const [payeeId, setPayeeId] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isWaitingForPin, setIsWaitingForPin] = useState(false);
    const [pendingSettlementId, setPendingSettlementId] = useState<number | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    React.useEffect(() => {
        const fetchMembers = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const currentUserId = currentUser.id;

                // Always fetch friends (has balance data)
                const friendsRes = await ApiService.get('/friends');
                const friendsMap = new Map<number, number>();
                friendsRes.data.forEach((f: any) => friendsMap.set(f.id, f.balance || 0));

                if (groupId) {
                    const res = await ApiService.get(`/groups/${groupId}/members`);
                    setMembers(res.data
                        .filter((m: any) => Number(m.id) !== Number(currentUserId))
                        .map((m: any) => ({ ...m, balance: friendsMap.get(m.id) || 0 }))
                        .filter((m: any) => m.balance < 0)
                    );
                } else {
                    setMembers(friendsRes.data
                        .filter((f: any) => Number(f.id) !== Number(currentUserId))
                        .map((f: any) => ({ id: f.id, name: f.name, mobile_number: f.mobileNumber, balance: f.balance || 0 }))
                        .filter((f: any) => f.balance < 0)
                    );
                }
            } catch (err) {
                console.error('Failed to fetch members');
            }
        };
        fetchMembers();
    }, [groupId]);

    const selectedMember = members.find(m => String(m.id) === String(payeeId));
    const maxAmount = selectedMember && selectedMember.balance ? Math.abs(parseFloat(String(selectedMember.balance))) : 0;

    const handleSettle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payeeId || !amount) {
            setError('Please select a payee and enter an amount.');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Amount must be greater than zero.');
            return;
        }
        
        // Use a small epsilon for floating point comparison
        if (numAmount > maxAmount + 0.01) {
            setError(`Amount cannot exceed ₹${maxAmount.toFixed(2)} (total owed).`);
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            // Step A: Initiate — backend generates a settlement key
            const initiateRes = await ApiService.post('/settlements/initiate', {
                payeeId: parseInt(payeeId),
                amount: parseFloat(amount),
                groupId: groupId || null
            });

            const settlementId = initiateRes.data.id;

            if (!settlementId) {
                throw new Error("Backend did not return settlement ID.");
            }

            setPendingSettlementId(settlementId);
            setIsWaitingForPin(true);
        } catch (error: any) {
            setError(error.response?.data?.message || error.message || 'Failed to process settlement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin || pin.length !== 6) {
            setError('Please enter the 6-digit PIN from the payee.');
            return;
        }

        setError('');
        setIsLoading(true);
        try {
            await ApiService.post('/settlements/confirm', {
                settlementId: pendingSettlementId,
                key: pin
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error: any) {
            setError(error.response?.data?.message || error.message || 'Invalid PIN or failed to confirm settlement');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWaitingForPin && pendingSettlementId) {
            interval = setInterval(async () => {
                try {
                    const res = await ApiService.get('/settlements/pending');
                    const pendingIds = res.data.map((s: any) => s.id);
                    if (!pendingIds.includes(pendingSettlementId)) {
                        setSuccess(true);
                        setTimeout(() => {
                            onClose();
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Polling failed');
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isWaitingForPin, pendingSettlementId, onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md z-10 my-auto"
            >
                <Card className="!p-0 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-slate-900/95 backdrop-blur-3xl overflow-hidden !rounded-2xl sm:!rounded-3xl md:!rounded-[2.5rem] inner-glow relative max-h-[92vh] flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="p-4 sm:p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
                                <Wallet size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter">
                                    Finance Transfer
                                </h2>
                                <p className="text-[9px] sm:text-[10px] text-emerald-500/70 font-black uppercase tracking-[2px]">Secure Settlement Grid</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors border border-white/5"
                        >
                            <X size={18} className="sm:w-5 sm:h-5" />
                        </motion.button>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1">
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

                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-12 text-center"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                        <ShieldCheck size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Transfer Cleared</h3>
                                    <p className="text-slate-400 font-bold">Your transaction has been verified on the ledger.</p>
                                    <div className="mt-8 text-emerald-500 font-black text-xs uppercase tracking-widest animate-pulse">
                                        Closing terminal...
                                    </div>
                                </motion.div>
                            ) : isWaitingForPin ? (
                                <motion.form
                                    key="confirm"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleConfirm}
                                    className="space-y-6"
                                >
                                    <div className="text-center space-y-2 mb-6">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                            <ShieldCheck size={28} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-white">Security Verification</h3>
                                        <p className="text-sm text-slate-400 font-bold">
                                            Ask <span className="text-emerald-400">{selectedMember?.name}</span> for the 6-digit PIN on their dashboard to authorize this transfer.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            label="6-Digit Authorization PIN"
                                            type="text"
                                            placeholder="123456"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            data-testid="settlement-pin-input"
                                            required
                                            className="text-center tracking-[0.5em] font-black text-xl"
                                        />
                                    </div>
                                    <div className="pt-4 flex flex-col gap-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-14 md:h-16 !rounded-2xl shadow-xl shadow-emerald-500/20"
                                            isLoading={isLoading}
                                            leftIcon={<ShieldCheck size={20} />}
                                        >
                                            {isLoading ? 'Verifying...' : 'Authorize Transfer'}
                                        </Button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="settle"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleSettle}
                                    className="space-y-6"
                                >
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1 opacity-60">Who are you paying?</label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {members.length === 0 ? (
                                                <div className="text-center py-6 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                                    You don't owe anyone right now! 🎉
                                                </div>
                                            ) : (
                                                members.map(m => (
                                                    <motion.button
                                                        key={m.id}
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setPayeeId(String(m.id))}
                                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${payeeId === String(m.id)
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                                            : 'bg-slate-950/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all duration-300 ${payeeId === String(m.id)
                                                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                                            : 'bg-slate-800 text-slate-500'
                                                            }`}>
                                                            {m.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-bold text-sm truncate transition-colors ${payeeId === String(m.id) ? 'text-emerald-400' : 'text-slate-300'
                                                                }`}>{m.name}</p>
                                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest truncate">{m.mobile_number}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-rose-400 text-xs font-black">₹{Math.abs(m.balance).toFixed(2)}</p>
                                                        </div>
                                                        {payeeId === String(m.id) && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Input
                                            label={`Settlement Amount (₹)${maxAmount > 0 ? ` — Max: ₹${maxAmount.toFixed(2)}` : ''}`}
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            data-testid="settlement-amount-input"
                                            step="0.01"
                                            required
                                        />
                                        {payeeId && maxAmount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setAmount(maxAmount.toFixed(2))}
                                                className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest hover:text-emerald-400 transition-colors ml-1"
                                            >
                                                ↑ Settle full amount (₹{maxAmount.toFixed(2)})
                                            </button>
                                        )}
                                    </div>

                                    <div className="pt-4 flex flex-col gap-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-14 md:h-16 !rounded-2xl shadow-xl shadow-emerald-500/20"
                                            isLoading={isLoading}
                                            leftIcon={<Wallet size={20} />}
                                        >
                                            {isLoading ? 'Processing...' : 'Settle Now'}
                                        </Button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default SettlementModal;
