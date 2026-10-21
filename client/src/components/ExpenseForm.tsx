import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, ShieldCheck, Tag, Info, Users, Check } from 'lucide-react';
import ApiService from '../services/ApiService';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

interface ExpenseFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialGroupId?: number;
    expenseToEdit?: any;
}

interface Member {
    id: number;
    name: string;
    selected: boolean;
    customAmount: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose, onSuccess, initialGroupId, expenseToEdit }) => {
    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [amount, setAmount] = useState(expenseToEdit?.amount?.toString() || '');
    const [splitType, setSplitType] = useState(expenseToEdit?.split_type || 'EQUAL');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [payerId, setPayerId] = useState<number>(
        expenseToEdit?.payer_id || expenseToEdit?.payer?.id || currentUser.id || 0
    );
    const canEditExpense = !expenseToEdit || (expenseToEdit.payer_id ? expenseToEdit.payer_id === currentUser.id : true);
    const [groupId, setGroupId] = useState<string>(initialGroupId ? initialGroupId.toString() : (expenseToEdit?.groupId ? expenseToEdit.groupId.toString() : ''));
    const [groups, setGroups] = useState<any[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(canEditExpense ? '' : `Only the payer (${expenseToEdit.payer_name || 'the payer'}) has permission to edit this bill.`);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await ApiService.get('/groups');
                setGroups(res.data);
            } catch (err) {
                console.error('Failed to fetch groups');
            }
        };
        fetchGroups();
    }, []);

    // Fetch members when group changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (!groupId) {
                setMembers([]);
                return;
            }
            try {
                const res = await ApiService.get(`/groups/${groupId}/members`);
                setMembers(res.data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    selected: true,
                    customAmount: ''
                })));
            } catch (err) {
                console.error('Failed to fetch members');
            }
        };
        fetchMembers();
    }, [groupId]);

    const selectedMembers = members.filter(m => m.selected);
    const totalAmount = parseFloat(amount) || 0;

    // Calculate what each person's equal share would be
    const equalShare = selectedMembers.length > 0
        ? (totalAmount / selectedMembers.length).toFixed(2)
        : '0.00';

    // Sum of custom amounts for validation
    const customAmountsSum = selectedMembers.reduce(
        (sum, m) => sum + (parseFloat(m.customAmount) || 0), 0
    );

    const toggleMember = (id: number) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, selected: !m.selected } : m
        ));
    };

    const updateCustomAmount = (id: number, val: string) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, customAmount: val } : m
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedMembers.length === 0) {
            setError('Select at least one person to split with.');
            return;
        }

        if (splitType === 'EXACT') {
            const sum = parseFloat(customAmountsSum.toFixed(2));
            if (sum !== totalAmount) {
                setError(`Exact amounts must sum to ₹${totalAmount.toFixed(2)}. Current: ₹${sum.toFixed(2)}`);
                return;
            }
        }

        if (splitType === 'PERCENT') {
            const pctSum = selectedMembers.reduce((s, m) => s + (parseFloat(m.customAmount) || 0), 0);
            if (pctSum !== 100) {
                setError(`Percentages must sum to 100%. Current: ${pctSum}%`);
                return;
            }
        }

        setIsLoading(true);
        try {
            const userIds = selectedMembers.map(m => m.id);
            let options: any = {};

            if (splitType === 'EXACT') {
                options.amounts = selectedMembers.map(m => parseFloat(m.customAmount) || 0);
            } else if (splitType === 'PERCENT') {
                options.percentages = selectedMembers.map(m => parseFloat(m.customAmount) || 0);
            }

            const payload = {
                description,
                amount: totalAmount,
                splitType,
                groupId: groupId ? parseInt(groupId) : null,
                userIds,
                payerId,
                options
            };

            if (expenseToEdit) {
                await ApiService.put(`/expenses/${expenseToEdit.id}`, payload);
            } else {
                await ApiService.post('/expenses', payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${expenseToEdit ? 'update' : 'add'} expense`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
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
                className="relative w-full max-w-xl z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                <Card className="!p-0 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] bg-slate-900/60 backdrop-blur-3xl overflow-hidden !rounded-3xl md:!rounded-[2.5rem] inner-glow relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                                <Tag size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter">{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</h2>
                                <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-[2px]">{expenseToEdit ? 'Modify transaction' : 'Fair distribution of resources'}</p>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <Input
                                    label="Expense Description"
                                    placeholder="e.g. Midnight Pizza Raid 🍕"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    data-testid="expense-desc-input"
                                />
                            </div>

                            <Input
                                label="Total Amount (₹)"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                leftIcon={<IndianRupee size={18} className="text-emerald-500" />}
                                data-testid="expense-amount-input"
                            />

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1 opacity-60">Target Group</label>
                                <div className="relative group">
                                    <select
                                        className="w-full bg-slate-950/40 border border-white/5 rounded-[1.25rem] px-6 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-bold text-sm appearance-none cursor-pointer outline-none"
                                        value={groupId}
                                        onChange={(e) => setGroupId(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-900">Personal Mission</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 transition-transform group-hover:translate-y-[-40%]">
                                        <div className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45" />
                                    </div>
                                </div>
                            </div>

                            {/* Paid By Selection */}
                            {members.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1 opacity-60">
                                            Who Paid The Bill?
                                        </label>
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Holds Edit Rights
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-slate-950/40 border border-white/5 rounded-[1.25rem] px-6 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-bold text-sm appearance-none cursor-pointer outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                            value={payerId}
                                            disabled={!canEditExpense}
                                            onChange={(e) => setPayerId(parseInt(e.target.value))}
                                        >
                                            {members.map(m => (
                                                <option key={m.id} value={m.id} className="bg-slate-900">
                                                    {m.name} {m.id === currentUser.id ? '(You)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 transition-transform group-hover:translate-y-[-40%]">
                                            <div className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium px-1">
                                        🔒 Note: Only the selected payer will have permission to edit or delete this bill later.
                                    </p>
                                </div>
                            )}

                            {/* Splitting Strategy */}
                            <div className="space-y-4 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1 opacity-60">Splitting Strategy</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    {['EQUAL', 'EXACT', 'PERCENT'].map((t) => (
                                        <motion.button
                                            key={t}
                                            type="button"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSplitType(t)}
                                            className={`py-3 md:py-4 rounded-xl md:rounded-2xl border text-[9px] md:text-[10px] font-black uppercase tracking-[2px] transition-all duration-500 ${splitType === t ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)]' : 'bg-slate-950/40 border-white/5 text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}
                                        >
                                            {t}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Member Selection */}
                            {members.length > 0 && (
                                <div className="space-y-3 col-span-1 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1 opacity-60">
                                            Split Between ({selectedMembers.length}/{members.length})
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allSelected = members.every(m => m.selected);
                                                setMembers(prev => prev.map(m => ({ ...m, selected: !allSelected })));
                                            }}
                                            className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                                        >
                                            {members.every(m => m.selected) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {members.map(member => (
                                            <div
                                                key={member.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${member.selected
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-slate-950/30 border-white/5 opacity-50'
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMember(member.id)}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${member.selected
                                                        ? 'bg-emerald-500 text-slate-950'
                                                        : 'bg-slate-800 border border-white/10'
                                                        }`}
                                                >
                                                    {member.selected && <Check size={14} strokeWidth={3} />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${member.selected ? 'text-slate-200' : 'text-slate-500'}`}>
                                                        {member.name} {member.id === currentUser.id && <span className="text-[10px] text-emerald-500/60 ml-1">(You)</span>}
                                                    </p>
                                                    {splitType === 'EQUAL' && member.selected && totalAmount > 0 && (
                                                        <p className="text-[9px] text-emerald-500/60 font-bold">₹{equalShare} each</p>
                                                    )}
                                                </div>

                                                {/* Custom amount input for EXACT/PERCENT */}
                                                {member.selected && splitType !== 'EQUAL' && (
                                                    <div className="w-28 shrink-0">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder={splitType === 'PERCENT' ? '%' : '₹'}
                                                            value={member.customAmount}
                                                            onChange={(e) => updateCustomAmount(member.id, e.target.value)}
                                                            className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30 text-center"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Validation hint for EXACT/PERCENT */}
                                    {splitType === 'EXACT' && totalAmount > 0 && (
                                        <p className={`text-[9px] font-black uppercase tracking-widest ml-1 ${parseFloat(customAmountsSum.toFixed(2)) === totalAmount ? 'text-emerald-500' : 'text-amber-400'
                                            }`}>
                                            Total: ₹{customAmountsSum.toFixed(2)} / ₹{totalAmount.toFixed(2)}
                                            {parseFloat(customAmountsSum.toFixed(2)) === totalAmount && ' ✓'}
                                        </p>
                                    )}
                                    {splitType === 'PERCENT' && (
                                        <p className={`text-[9px] font-black uppercase tracking-widest ml-1 ${customAmountsSum === 100 ? 'text-emerald-500' : 'text-amber-400'
                                            }`}>
                                            Total: {customAmountsSum}% / 100%
                                            {customAmountsSum === 100 && ' ✓'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 md:pt-6">
                            <Button
                                type="submit"
                                className="w-full h-14 md:h-16 !rounded-2xl md:!rounded-[1.5rem] shadow-2xl shadow-emerald-500/30 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                isLoading={isLoading}
                                disabled={!canEditExpense}
                                leftIcon={<ShieldCheck size={22} />}
                            >
                                {!canEditExpense ? 'Locked (Only Payer Can Edit)' : expenseToEdit ? 'Update Transaction' : 'Secure Transaction'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default ExpenseForm;
