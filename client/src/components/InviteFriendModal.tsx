import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, UserPlus, Search, CheckCircle, AlertCircle, 
    Loader2, Check, UserCheck, UserX, Phone, Mail, Hash 
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import ApiService from '../services/ApiService';

interface InviteFriendModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface SearchUserResult {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    userCode: string;
    isFriend: boolean;
}

const getInitials = (name?: string) => {
    if (!name) return 'DU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarGradient = (id: number) => {
    const gradients = [
        'from-rose-500 to-orange-500',
        'from-emerald-500 to-teal-500',
        'from-blue-500 to-indigo-500',
        'from-violet-500 to-purple-500',
        'from-amber-500 to-yellow-500',
        'from-pink-500 to-rose-500',
    ];
    return gradients[id % gradients.length];
};

const formatMobileDisplay = (mobile: string) => {
    if (!mobile) return '';
    // Show clean mobile number (strip duplicate prefixes if any)
    const digits = mobile.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    if (digits.length > 10 && digits.startsWith('91')) {
        const last10 = digits.slice(-10);
        return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
    }
    return mobile;
};

const InviteFriendModal: React.FC<InviteFriendModalProps> = ({ onClose, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Debounced live search as user types
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setError('');

        const timer = setTimeout(async () => {
            try {
                const res = await ApiService.get('/users/search', {
                    params: { query: trimmed }
                });
                setSearchResults(res.data || []);
            } catch (err: any) {
                console.error('Failed to search users:', err);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    // Invite directly by clicking on a search card
    const handleInviteUser = async (user: SearchUserResult) => {
        if (user.isFriend || invitingUserId !== null || isSubmitting) return;

        setError('');
        setSuccess('');
        setInvitingUserId(user.id);

        try {
            await ApiService.post('/friends/invite', { userId: user.id });
            setSuccess(`📨 Invitation sent to ${user.name}! They can accept it from their dashboard.`);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to invite ${user.name}`);
        } finally {
            setInvitingUserId(null);
        }
    };

    // Invite by submitting form with typed query
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const res = await ApiService.post('/friends/invite', { query: trimmed });
            const friendName = res.data?.friend?.name || 'Friend';
            setSuccess(`📨 Invitation sent to ${friendName}! They can accept it from their dashboard.`);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 404) {
                setError('No member found with that 10-digit mobile, email, name, or DU code.');
            } else {
                setError(err.response?.data?.message || 'Failed to add friend');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
                className="relative z-10 w-full max-w-lg my-auto"
            >
                <Card className="!p-0 !rounded-[2rem] shadow-2xl shadow-rose-500/10 border-rose-500/20 bg-slate-900/90 backdrop-blur-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl shadow-rose-500/30">
                                <UserPlus size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Invite Friend</h3>
                                <p className="text-[10px] text-rose-400 font-black uppercase tracking-[2px]">Search &amp; Connect Allies</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                        {/* Status Messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-start gap-3"
                                >
                                    <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3"
                                >
                                    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                                    <span>{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Search Input */}
                        <div className="space-y-1">
                            <Input
                                label="Search by Mobile (10-Digit), Name, Email, or Code"
                                placeholder="e.g. 9876543210, Ayush, or DU-00042"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                leftIcon={<Search size={18} />}
                                rightIcon={
                                    isSearching ? (
                                        <Loader2 size={18} className="animate-spin text-rose-400" />
                                    ) : query ? (
                                        <button
                                            type="button"
                                            onClick={() => setQuery('')}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    ) : null
                                }
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-500 font-medium px-1 flex items-center gap-1.5 pt-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Enter 10-digit mobile number directly without <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded text-[10px]">+91</code>
                            </p>
                        </div>

                        {/* Live Search Suggestions Section */}
                        {query.trim().length >= 2 && (
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                        Matching Members
                                    </span>
                                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                        {searchResults.length} found
                                    </span>
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                    user.isFriend
                                                        ? 'bg-white/[0.02] border-white/5 opacity-80'
                                                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-rose-500/40 cursor-pointer shadow-lg shadow-black/20'
                                                }`}
                                                onClick={() => !user.isFriend && handleInviteUser(user)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Avatar */}
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(user.id)} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md`}>
                                                        {getInitials(user.name)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-black text-white truncate">
                                                                {user.name}
                                                            </h4>
                                                            <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                                                                {user.userCode}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 truncate">
                                                            {user.mobileNumber && (
                                                                <span className="flex items-center gap-1 font-mono text-rose-300">
                                                                    <Phone size={10} className="text-rose-400 shrink-0" />
                                                                    {formatMobileDisplay(user.mobileNumber)}
                                                                </span>
                                                            )}
                                                            {user.email && (
                                                                <span className="flex items-center gap-1 truncate text-slate-400">
                                                                    <Mail size={10} className="shrink-0" />
                                                                    <span className="truncate">{user.email}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button / Badge */}
                                                <div className="shrink-0">
                                                    {user.isFriend ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                                            <Check size={12} strokeWidth={3} />
                                                            Friend
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={invitingUserId === user.id || isSubmitting}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInviteUser(user);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            {invitingUserId === user.id ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <UserPlus size={13} strokeWidth={2.5} />
                                                            )}
                                                            <span>Invite</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : !isSearching ? (
                                        <div className="p-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <UserX size={28} className="mx-auto text-slate-600 mb-2" />
                                            <p className="text-xs font-bold text-slate-300">
                                                No members matching &ldquo;{query}&rdquo;
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                                                Make sure the 10-digit mobile number, email, or name is registered on Daily Udhari.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-14 !rounded-2xl shadow-xl shadow-rose-500/25 !bg-rose-500 hover:!bg-rose-400 text-slate-950 font-black text-sm uppercase tracking-wider"
                            isLoading={isSubmitting}
                            leftIcon={<UserPlus size={18} strokeWidth={2.5} />}
                        >
                            {isSubmitting ? 'Sending Invite...' : 'Send Friend Invite'}
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>,
        document.body
    );
};

export default InviteFriendModal;
