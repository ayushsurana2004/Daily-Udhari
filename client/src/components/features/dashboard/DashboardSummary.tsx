import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, Key, Wallet, ArrowUpRight, ArrowDownLeft, 
    LogOut, ShieldAlert, ShieldCheck, UserPlus, Users, Check, X, Mail 
} from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ApiService from '../../../services/ApiService';

interface DashboardSummaryProps {
    title?: string;
    onAddExpense: () => void;
    onSettleUp: () => void;
    onExitGroup?: () => void;
    groupId: number | null;
    refreshTrigger?: number;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ 
    title = "Dashboard", 
    onAddExpense, 
    onSettleUp, 
    onExitGroup,
    groupId, 
    refreshTrigger 
}) => {
    const [summary, setSummary] = React.useState({ totalBalance: 0, youOwe: 0, youAreOwed: 0 });
    const [pendingSettlements, setPendingSettlements] = React.useState<any[]>([]);
    const [pendingInvitations, setPendingInvitations] = React.useState<any[]>([]);
    const [processingInviteId, setProcessingInviteId] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    React.useEffect(() => {
        const fetchBalances = async () => {
            setIsLoading(true);
            try {
                const url = groupId ? `/balances?groupId=${groupId}` : '/balances';
                const [balanceRes, pendingRes, invitesRes] = await Promise.all([
                    ApiService.get(url),
                    ApiService.get('/settlements/pending'),
                    ApiService.get('/invitations/pending')
                ]);
                setSummary(balanceRes.data);

                // Filter by group if needed, but usually we want to see all pending settlements on the dashboard
                const filteredPending = groupId 
                    ? pendingRes.data.filter((s: any) => s.groupId === groupId)
                    : pendingRes.data;
                setPendingSettlements(filteredPending);
                setPendingInvitations(invitesRes.data || []);
            } catch (err) {
                console.error('Failed to fetch balances, settlements or invitations');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBalances();
    }, [groupId, refreshTrigger]);

    const cards = [
        {
            title: 'Total Balance',
            amount: Number(summary?.totalBalance) || 0,
            icon: <Wallet className="text-emerald-500" size={24} />,
            color: (Number(summary?.totalBalance) || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
            label: (Number(summary?.totalBalance) || 0) >= 0 ? 'You are owed' : 'You owe',
            bg: 'bg-emerald-500/5'
        },
        {
            title: 'You Owe',
            amount: Number(summary?.youOwe) || 0,
            icon: <ArrowDownLeft className="text-rose-500" size={24} />,
            color: 'text-rose-400',
            label: 'Pending payments',
            bg: 'bg-rose-500/5'
        },
        {
            title: 'You are Owed',
            amount: Number(summary?.youAreOwed) || 0,
            icon: <ArrowUpRight className="text-cyan-500" size={24} />,
            color: 'text-cyan-400',
            label: 'Collect from squad',
            bg: 'bg-cyan-500/5'
        }
    ];

    const handleApprove = async (id: number) => {
        try {
            await ApiService.post(`/settlements/${id}/approve`);
            setPendingSettlements(prev => prev.filter(s => s.id !== id));
            window.location.reload();
        } catch (error) {
            console.error('Failed to approve');
        }
    };

    const handleAcceptInvite = async (invitationId: number) => {
        setProcessingInviteId(invitationId);
        try {
            await ApiService.post(`/invitations/${invitationId}/accept`);
            setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
            window.location.reload();
        } catch (error) {
            console.error('Failed to accept invitation:', error);
        } finally {
            setProcessingInviteId(null);
        }
    };

    const handleRejectInvite = async (invitationId: number) => {
        setProcessingInviteId(invitationId);
        try {
            await ApiService.post(`/invitations/${invitationId}/reject`);
            setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
        } catch (error) {
            console.error('Failed to decline invitation:', error);
        } finally {
            setProcessingInviteId(null);
        }
    };

    return (
        <div className="space-y-10">
            {/* Incoming Invitations Banner */}
            <AnimatePresence>
                {pendingInvitations.length > 0 && (
                    <div className="space-y-3">
                        {pendingInvitations.map((inv) => {
                            const isGroup = inv.type === 'GROUP';
                            const isProcessing = processingInviteId === inv.id;

                            return (
                                <motion.div
                                    key={inv.id}
                                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                    className="p-5 md:p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/90 backdrop-blur-2xl shadow-xl shadow-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                            isGroup 
                                                ? 'bg-gradient-to-tr from-cyan-600 to-emerald-500 text-slate-950 shadow-cyan-500/20' 
                                                : 'bg-gradient-to-tr from-indigo-600 to-rose-500 text-slate-950 shadow-indigo-500/20'
                                        }`}>
                                            {isGroup ? <Users size={26} strokeWidth={2.5} /> : <UserPlus size={26} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    isGroup 
                                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                                                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                                }`}>
                                                    {isGroup ? 'Squad Invite' : 'Friend Request'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {inv.sender.userCode}
                                                </span>
                                            </div>
                                            <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                                                {isGroup ? (
                                                    <>
                                                        <span className="text-indigo-400">{inv.sender.name}</span> invited you to join <strong className="text-cyan-300">&ldquo;{inv.group?.name}&rdquo;</strong>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-indigo-400">{inv.sender.name}</span> wants to connect as an ally
                                                    </>
                                                )}
                                            </h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-2">
                                                {inv.sender.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={12} className="text-slate-500" />
                                                        {inv.sender.email}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>Approve to join and split bills</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0 relative z-10">
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handleRejectInvite(inv.id)}
                                            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-rose-500/30 bg-slate-950/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                                        >
                                            <X size={15} />
                                            <span>Decline</span>
                                        </button>
                                        <Button
                                            onClick={() => handleAcceptInvite(inv.id)}
                                            isLoading={isProcessing}
                                            leftIcon={<Check size={16} strokeWidth={3} />}
                                            className="!rounded-xl !bg-gradient-to-r !from-emerald-500 !to-teal-500 hover:!from-emerald-400 hover:!to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95"
                                        >
                                            {isGroup ? 'Join Squad' : 'Accept Request'}
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            {pendingSettlements.length > 0 && (
                <div className="space-y-4">
                    {pendingSettlements.map((s) => {
                        const isPayee = s.payee.id === currentUser.id;
                        return (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 md:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isPayee ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPayee ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm md:text-base font-black tracking-tight ${isPayee ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {isPayee ? 'Action Required: Confirm Payment' : 'Waiting for Confirmation'}
                                        </h3>
                                        <p className="text-slate-300 text-xs md:text-sm font-medium mt-1">
                                            {isPayee 
                                                ? <>{s.payer.name} is settling <strong className="text-white">₹{s.amount.toFixed(2)}</strong>.</>
                                                : <>You initiated a settlement of <strong className="text-white">₹{s.amount.toFixed(2)}</strong> to {s.payee.name}.</>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    {isPayee ? (
                                        <>
                                            <div className="text-center px-4 py-2 bg-slate-950/50 rounded-xl border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Authorization PIN</p>
                                                <p className="text-xl font-black text-amber-400 tracking-[0.2em]">{s.settlementKey}</p>
                                            </div>
                                            <Button
                                                onClick={() => handleApprove(s.id)}
                                                className="!bg-amber-500 hover:!bg-amber-400 text-slate-950 !rounded-xl"
                                                leftIcon={<ShieldCheck size={18} />}
                                            >
                                                Approve
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center px-4 py-2 bg-slate-950/50 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400">
                                                Ask {s.payee.name} to enter their PIN or click Approve.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text tracking-tighter mb-2 sm:mb-4"
                    >
                        {title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 font-bold uppercase tracking-[2px] sm:tracking-[3px] text-[9px] sm:text-[10px] opacity-60"
                    >
                        Financial Intelligence • Squad Dynamics
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full md:w-auto"
                >
                    <Button
                        variant="secondary"
                        onClick={onSettleUp}
                        leftIcon={<Key size={18} />}
                        className="!bg-slate-900/50 backdrop-blur-xl border-white/5 h-12 md:h-14 w-full sm:w-auto !justify-center"
                    >
                        Settle Up
                    </Button>
                    <Button
                        onClick={onAddExpense}
                        leftIcon={<PlusCircle size={18} />}
                        className="h-12 md:h-14 shadow-2xl shadow-emerald-500/40 w-full sm:w-auto !justify-center"
                    >
                        Add Expense
                    </Button>
                    {onExitGroup && (
                        <Button
                            variant="secondary"
                            onClick={onExitGroup}
                            leftIcon={<LogOut size={16} />}
                            className="!bg-rose-500/10 hover:!bg-rose-500/20 text-rose-400 !border-rose-500/20 h-12 md:h-14 w-full sm:w-auto !justify-center"
                        >
                            Exit Squad
                        </Button>
                    )}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8">
                {isLoading ? (
                    [0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Card className="relative !p-5 sm:!p-6 md:!p-8 h-full">
                                <div className="flex flex-col gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-800 animate-pulse" />
                                    <div className="w-24 h-3 rounded-full bg-slate-800 animate-pulse" />
                                    <div className="w-36 h-8 rounded-xl bg-slate-800/60 animate-pulse" />
                                    <div className="w-28 h-2 rounded-full bg-slate-800/40 animate-pulse mt-4" />
                                </div>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                        >
                            <Card className="relative group !p-5 sm:!p-6 md:!p-8 h-full">
                                <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

                                <div className="flex flex-col h-full relative z-10">
                                    <div className="p-2.5 sm:p-3 bg-white/5 w-fit rounded-2xl mb-4 sm:mb-6 border border-white/5">
                                        {card.icon}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] sm:tracking-[3px] mb-1 sm:mb-2">{card.title}</p>
                                    <div className="flex items-baseline gap-2 overflow-hidden">
                                        <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter ${card.color} truncate`}>
                                            ₹ {Math.abs(card.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                    <p className="mt-auto text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-4 sm:pt-6 italic">{card.label}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DashboardSummary;
