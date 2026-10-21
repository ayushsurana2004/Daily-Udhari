import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Filter, Calendar, IndianRupee, ChevronRight, Tag } from 'lucide-react';
import Card from '../../components/ui/Card';
import ApiService from '../../services/ApiService';

type TabType = 'EXPENSES' | 'SETTLEMENTS';
type FilterType = 'ALL' | 'PAID' | 'OWE';
type SortOrder = 'NEWEST' | 'OLDEST';

const Activity: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('EXPENSES');
    const [expenses, setExpenses] = useState<any[]>([]);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<FilterType>('ALL');
    const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchExpenses = async () => {
            setIsLoading(true);
            try {
                const [expensesRes, settlementsRes] = await Promise.all([
                    ApiService.get('/expenses'),
                    ApiService.get('/settlements').catch(() => ({ data: [] }))
                ]);
                setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : (expensesRes.data?.expenses || []));
                setSettlements(Array.isArray(settlementsRes.data) ? settlementsRes.data : []);
            } catch (err) {
                console.error('Failed to fetch activity data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    // Filter
    const filtered = expenses.filter(expense => {
        if (filterType === 'ALL') return true;
        if (filterType === 'PAID') return expense.user_role === 'PAID';
        if (filterType === 'OWE') return expense.user_role !== 'PAID';
        return true;
    });

    // Sort
    // Sort (Applies to both)
    const sortedExpenses = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    const sortedSettlements = [...settlements].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    // UI helpers
    const cycleFilter = () => {
        setFilterType(prev => prev === 'ALL' ? 'PAID' : prev === 'PAID' ? 'OWE' : 'ALL');
    };

    const toggleSort = () => {
        setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST');
    };

    const filterLabel = filterType === 'ALL' ? 'All' : filterType === 'PAID' ? 'You Paid' : 'You Owe';
    const filterColor = filterType === 'ALL'
        ? 'text-slate-400 border-white/10 bg-white/5'
        : filterType === 'PAID'
            ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10'
            : 'text-rose-400 border-rose-500/20 bg-rose-500/10';

    const sortColor = sortOrder === 'NEWEST'
        ? 'text-slate-400 border-white/10 bg-white/5'
        : 'text-amber-400 border-amber-500/20 bg-amber-500/10';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-12">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-cyan-500/20 shrink-0">
                        <TrendingUp size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">Activity Stream</h1>
                        <p className="text-cyan-500/70 font-black uppercase tracking-[2px] sm:tracking-[3px] text-[9px] sm:text-[10px]">Real-time Ledger Synchronization</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    {activeTab === 'EXPENSES' && (
                        <button
                            onClick={cycleFilter}
                            className={`flex-1 sm:flex-none h-10 sm:h-12 px-3 sm:px-6 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${filterColor}`}
                        >
                            <Filter size={14} className="sm:w-4 sm:h-4" /> {filterLabel}
                        </button>
                    )}
                    <button
                        onClick={toggleSort}
                        className={`flex-1 sm:flex-none h-10 sm:h-12 px-3 sm:px-6 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${sortColor}`}
                    >
                        <Calendar size={14} className="sm:w-4 sm:h-4" /> {sortOrder === 'NEWEST' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>

            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 mb-6 w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('EXPENSES')}
                    className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'EXPENSES'
                            ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Expenses
                </button>
                <button
                    onClick={() => setActiveTab('SETTLEMENTS')}
                    className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'SETTLEMENTS'
                            ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Settlements
                </button>
            </div>

            <div className="premium-card p-1">
                <div className="bg-slate-950/40 rounded-2xl sm:rounded-[1.8rem] p-3 sm:p-6 md:p-8">
                    <Card className="!p-0 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-slate-900/20 backdrop-blur-3xl overflow-visible">
                        <div className="p-4 sm:p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/[0.02] to-transparent rounded-t-[2rem]">
                            <div>
                                <h3 className="font-black text-slate-100 uppercase tracking-[2px] sm:tracking-[3px] text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
                                    {activeTab === 'EXPENSES' ? 'Expense History' : 'Settlement History'}
                                </h3>
                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                                    {activeTab === 'EXPENSES' ? sortedExpenses.length : sortedSettlements.length} transaction{(activeTab === 'EXPENSES' ? sortedExpenses.length : sortedSettlements.length) !== 1 ? 's' : ''} • {activeTab === 'EXPENSES' ? filterLabel + ' • ' : ''}{sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <div className="p-20 text-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full mx-auto mb-6"
                                        />
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[3px] animate-pulse">Syncing activity...</p>
                                    </div>
                                ) : activeTab === 'EXPENSES' ? (
                                    sortedExpenses.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center">
                                            <p className="text-[11px] text-slate-600 font-black uppercase tracking-[2px]">
                                                {expenses.length > 0 ? `No activity found for filter: ${filterLabel}` : 'No expense activity yet.'}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        sortedExpenses.map((expense, i) => (
                                            <motion.div
                                                key={expense.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="p-3.5 sm:p-5 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden gap-2 sm:gap-4"
                                            >
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-500 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 opacity-0 group-hover:opacity-100" />

                                                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10 min-w-0 flex-1">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-slate-950/50 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-slate-500 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-500 border border-white/5 shadow-inner shrink-0">
                                                        <IndianRupee size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <h4 className="font-black text-slate-100 group-hover:text-cyan-400 transition-colors tracking-tight text-sm sm:text-base md:text-lg truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">{expense.description}</h4>
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5">
                                                                <Tag size={10} className="text-cyan-500/50 sm:w-3 sm:h-3" />
                                                                {expense.split_type}
                                                            </span>
                                                            <span className="flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5">
                                                                <Calendar size={10} className="text-cyan-500/50 sm:w-3 sm:h-3" />
                                                                {new Date(expense.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-6 md:gap-10 relative z-10 shrink-0">
                                                    <div className="text-right space-y-0.5 sm:space-y-1">
                                                        <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-[1px] sm:tracking-[2px]">Total: ₹{expense.amount}</p>
                                                        <p className={`font-black italic tracking-tighter text-base sm:text-xl md:text-2xl ${expense.user_role === 'PAID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            ₹{expense.user_share}
                                                        </p>
                                                        <p className={`text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-widest ${expense.user_role === 'PAID' ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                                                            {expense.user_role === 'PAID' ? 'Reclaimed' : 'Debt'}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-700 bg-white/5 border border-white/5 group-hover:text-cyan-400 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/10 transition-all duration-300">
                                                        <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )
                                ) : (
                                    sortedSettlements.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 sm:p-20 text-center">
                                            <p className="text-[10px] sm:text-[11px] text-slate-600 font-black uppercase tracking-[2px]">
                                                No settlement history yet.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        sortedSettlements.map((settlement, i) => {
                                            const isPayee = settlement.payee.id === currentUser.id;
                                            const isConfirmed = settlement.status === 'CONFIRMED';
                                            return (
                                                <motion.div
                                                    key={settlement.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="p-3.5 sm:p-5 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden gap-2 sm:gap-4"
                                                >
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500 opacity-0 group-hover:opacity-100" />

                                                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10 min-w-0 flex-1">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-[1.25rem] flex items-center justify-center border shadow-inner transition-all duration-500 shrink-0 ${isConfirmed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950'}`}>
                                                            <IndianRupee size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
                                                        </div>
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <h4 className="font-black text-slate-100 transition-colors tracking-tight text-sm sm:text-base md:text-lg truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
                                                                {isPayee ? `From ${settlement.payer.name}` : `To ${settlement.payee.name}`}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                <span className={`flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5 ${isConfirmed ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                    {settlement.status}
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-white/5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded-lg border border-white/5">
                                                                    <Calendar size={10} className="text-slate-500/50 sm:w-3 sm:h-3" />
                                                                    {settlement.createdAt ? new Date(settlement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 sm:gap-6 md:gap-10 relative z-10 shrink-0">
                                                        <div className="text-right space-y-0.5 sm:space-y-1">
                                                            <p className={`font-black italic tracking-tighter text-base sm:text-xl md:text-2xl ${isPayee ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                ₹{parseFloat(settlement.amount).toFixed(2)}
                                                            </p>
                                                            <p className={`text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isPayee ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                                                                {isPayee ? 'Received' : 'Paid'}
                                                            </p>
                                                        </div>
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-700 bg-white/5 border border-white/5 group-hover:text-cyan-400 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/10 transition-all duration-300">
                                                            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default Activity;
