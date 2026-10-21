import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../ui/Card';
import { IndianRupee, ChevronRight, Calendar, Tag, Trash2, Edit2, Lock, UserCheck } from 'lucide-react';
import ApiService from '../../../services/ApiService';
import ExpenseForm from '../../ExpenseForm';

interface ExpenseListProps {
    groupId: number | null;
    refreshTrigger?: number;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ groupId, refreshTrigger }) => {
    const [expenses, setExpenses] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filterType, setFilterType] = React.useState<'ALL' | 'PAID' | 'OWE'>('ALL');
    const [expenseToEdit, setExpenseToEdit] = React.useState<any>(null);
    const [localRefreshTrigger, setLocalRefreshTrigger] = React.useState(0);

    const fetchExpenses = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const url = groupId ? `/expenses?groupId=${groupId}` : '/expenses';
            const res = await ApiService.get(url);
            const data = res.data;
            setExpenses(Array.isArray(data) ? data : (data?.expenses || []));
        } catch (err) {
            console.error('Failed to fetch expenses');
        } finally {
            setIsLoading(false);
        }
    }, [groupId]);

    React.useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses, refreshTrigger, localRefreshTrigger]);

    const handleDelete = async (expenseId: number) => {
        if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            try {
                await ApiService.delete(`/expenses/${expenseId}`);
                setLocalRefreshTrigger(prev => prev + 1);
            } catch (err) {
                console.error('Failed to delete expense', err);
                alert('Failed to delete expense. You may not be authorized.');
            }
        }
    };

    if (isLoading) {
        return (
            <Card className="p-20 flex flex-col items-center justify-center border-white/5 bg-slate-900/20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full mb-6"
                />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[3px] animate-pulse">Syncing transactions...</p>
            </Card>
        );
    }

    const filteredExpenses = expenses.filter(expense => {
        if (filterType === 'ALL') return true;
        if (filterType === 'PAID') return expense.user_role === 'PAID';
        if (filterType === 'OWE') return expense.user_role !== 'PAID';
        return true;
    });

    const filterLabel = filterType === 'ALL' ? 'All' : filterType === 'PAID' ? 'You Paid' : 'You Owe';
    const filterColor = filterType === 'ALL'
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : filterType === 'PAID'
            ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

    const cycleFilter = () => {
        setFilterType(prev => prev === 'ALL' ? 'PAID' : prev === 'PAID' ? 'OWE' : 'ALL');
    };

    return (
        <>
        <Card className="!p-0 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-slate-900/20 backdrop-blur-3xl overflow-visible">
            <div className="p-3.5 sm:p-5 md:p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/[0.02] to-transparent rounded-t-[2rem]">
                <div>
                    <h3 className="font-black text-slate-100 uppercase tracking-[2px] sm:tracking-[3px] text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">Transaction Stream</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">History of shared economic energy</p>
                </div>
                <button
                    onClick={cycleFilter}
                    className={`text-[9px] sm:text-[10px] font-black transition-all uppercase tracking-[1px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border ${filterColor}`}
                >
                    ● {filterLabel}
                </button>
            </div>

            <div className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                    {filteredExpenses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 sm:p-20 text-center"
                        >
                            <p className="text-[10px] sm:text-[11px] text-slate-600 font-black uppercase tracking-[2px]">
                                {expenses.length > 0
                                    ? `No transactions match filter: ${filterLabel}`
                                    : 'Void Detected: No Transactions Found'}
                            </p>
                        </motion.div>
                    ) : (
                        filteredExpenses.map((expense, i) => (
                            <motion.div
                                key={expense.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3.5 sm:p-5 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden gap-2 sm:gap-4"
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 opacity-0 group-hover:opacity-100" />

                                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10 min-w-0 flex-1">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-slate-950/50 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-500 border border-white/5 shadow-inner shrink-0">
                                        <IndianRupee size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h4 className="font-black text-slate-100 group-hover:text-emerald-400 transition-colors tracking-tight text-sm sm:text-base md:text-lg truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md">{expense.description}</h4>
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5">
                                                <Tag size={10} className="text-emerald-500/50 sm:w-3 sm:h-3" />
                                                {expense.split_type}
                                            </span>
                                            <span className="flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5">
                                                <Calendar size={10} className="text-cyan-500/50 sm:w-3 sm:h-3" />
                                                {new Date(expense.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            {expense.payer_name && (
                                                <span className={`flex items-center gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border text-[8px] sm:text-[9px] font-bold ${
                                                    expense.can_edit 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                        : 'bg-white/5 border-white/5 text-slate-400'
                                                }`}>
                                                    <UserCheck size={10} className={expense.can_edit ? 'text-emerald-400' : 'text-slate-500'} />
                                                    {expense.can_edit ? 'You Paid' : expense.payer_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 md:gap-8 relative z-10 shrink-0">
                                    <div className="text-right space-y-0.5">
                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-[1px] sm:tracking-[2px]">₹{expense.amount}</p>
                                        <p className={`font-black italic tracking-tighter text-base sm:text-xl md:text-2xl ${expense.user_role === 'PAID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ₹{expense.user_share}
                                        </p>
                                        <p className={`text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-widest ${expense.user_role === 'PAID' ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                                            {expense.user_role === 'PAID' ? 'Reclaimed' : 'Owe'}
                                        </p>
                                    </div>

                                    {/* Action buttons visible and accessible on mobile */}
                                    <div className="flex gap-1 sm:gap-2 items-center">
                                        {expense.can_edit ? (
                                            <>
                                                <button 
                                                    title="Edit Expense"
                                                    onClick={(e) => { e.stopPropagation(); setExpenseToEdit(expense); }}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 bg-white/5 border border-white/5 hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-cyan-500/10 transition-all duration-300"
                                                >
                                                    <Edit2 size={13} className="sm:w-4 sm:h-4" />
                                                </button>
                                                <button 
                                                    title="Delete Expense"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 bg-white/5 border border-white/5 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/10 transition-all duration-300"
                                                >
                                                    <Trash2 size={13} className="sm:w-4 sm:h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div 
                                                title={`Locked: Only ${expense.payer_name || 'the payer'} can edit`}
                                                className="w-7 h-7 sm:w-8 sm:h-8 md:h-10 md:px-3 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center gap-1.5 text-slate-600 bg-white/[0.02] border border-white/5 cursor-not-allowed select-none"
                                            >
                                                <Lock size={12} className="text-slate-600" />
                                                <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">Locked</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </Card>
        {expenseToEdit && (
            <ExpenseForm 
                onClose={() => setExpenseToEdit(null)}
                onSuccess={() => {
                    setExpenseToEdit(null);
                    setLocalRefreshTrigger(prev => prev + 1);
                }}
                initialGroupId={groupId || undefined}
                expenseToEdit={expenseToEdit}
            />
        )}
        </>
    );
};

export default ExpenseList;
