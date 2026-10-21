import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Copy, 
    Check, 
    Share2, 
    QrCode, 
    CreditCard, 
    User, 
    Mail, 
    Phone, 
    ShieldCheck, 
    Sparkles, 
    Users, 
    Layers, 
    LogOut,
    CheckCircle2,
    Wifi
} from 'lucide-react';
import ApiService from '../services/ApiService';

interface UserProfileModalProps {
    onClose: () => void;
    onLogout?: () => void;
}

interface UserProfileData {
    id?: number;
    name?: string;
    email?: string;
    mobileNumber?: string;
    userCode?: string;
    friendsCount?: number;
    groupsCount?: number;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'card' | 'qr' | 'details'>('card');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Initial state from localStorage
    const [profile, setProfile] = useState<UserProfileData>(() => {
        try {
            const cached = JSON.parse(localStorage.getItem('user') || '{}');
            const userCode = cached.userCode || (cached.id ? `DU-${String(cached.id).padStart(5, '0')}` : 'DU-00001');
            return { ...cached, userCode };
        } catch {
            return { name: 'User', email: '', mobileNumber: '', userCode: 'DU-00001' };
        }
    });

    // Fetch fresh user profile details
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await ApiService.get('/users/me');
                if (res.data) {
                    const freshData: UserProfileData = {
                        ...res.data,
                        userCode: res.data.userCode || `DU-${String(res.data.id).padStart(5, '0')}`
                    };
                    setProfile(freshData);
                    localStorage.setItem('user', JSON.stringify({
                        ...JSON.parse(localStorage.getItem('user') || '{}'),
                        ...freshData
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            }
        };
        fetchProfile();
    }, []);

    const userCode = profile.userCode || `DU-${String(profile.id || 1).padStart(5, '0')}`;
    const initials = (profile.name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleCopy = (text: string, fieldName: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleShare = async () => {
        const shareText = `Add me on Daily Udhari! My Unique Code is ${userCode} (Mobile: ${profile.mobileNumber || ''})`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Daily Udhari Profile Code',
                    text: shareText,
                    url: window.location.origin
                });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
            } catch (err) {
                // Ignore abort
            }
        } else {
            handleCopy(shareText, 'share');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl"
            />

            {/* Modal Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
                {/* Top Ambient Glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/15 via-cyan-500/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 flex items-center justify-between border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/25">
                                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-lg sm:text-xl text-emerald-400">
                                    {initials}
                                </div>
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_#10b981]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{profile.name || 'Your Profile'}</h2>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold">
                                    <ShieldCheck size={11} /> Verified
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Daily Udhari Member • Level 1</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-1.5 sm:p-2 gap-1.5 sm:gap-2 bg-slate-950/40 border-b border-white/5 shrink-0">
                    <button
                        onClick={() => setActiveTab('card')}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'card'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <CreditCard size={14} /> Pass
                    </button>
                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'qr'
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <QrCode size={14} /> QR & Code
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'details'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <User size={14} /> Details
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    <AnimatePresence mode="wait">
                        {/* TAB 1: DIGITAL CARD */}
                        {activeTab === 'card' && (
                            <motion.div
                                key="card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 sm:space-y-6"
                            >
                                {/* Holographic Digital Card */}
                                <div className="relative w-full aspect-[1.65/1] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-6 flex flex-col justify-between border border-white/15 shadow-2xl shadow-emerald-950/60 overflow-hidden group">
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent pointer-events-none" />
                                    <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

                                    {/* Card Top Row */}
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/40">
                                                D
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black tracking-widest uppercase text-white">Daily Udhari</p>
                                                <p className="text-[8px] font-bold text-emerald-400 tracking-wider uppercase">Prime Pass</p>
                                            </div>
                                        </div>
                                        <Wifi size={20} className="text-slate-400 rotate-90" />
                                    </div>

                                    {/* Chip & Monospace Code */}
                                    <div className="relative space-y-4 my-auto">
                                        <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-300/60 shadow-inner flex items-center justify-center">
                                            <div className="w-6 h-5 border border-amber-700/40 rounded grid grid-cols-2 gap-1" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[2px] text-slate-400 mb-1">Your Unique Udhar Code</p>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-widest drop-shadow-md">
                                                    {userCode}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(userCode, 'cardCode')}
                                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-400 transition-colors"
                                                    title="Copy Code"
                                                >
                                                    {copiedField === 'cardCode' ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Bottom Row */}
                                    <div className="relative flex items-end justify-between pt-2 border-t border-white/10">
                                        <div>
                                            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Account Holder</p>
                                            <p className="text-sm font-black text-white tracking-wide uppercase truncate max-w-[180px]">
                                                {profile.name || 'Member'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Mobile</p>
                                            <p className="text-xs font-mono font-bold text-emerald-400">
                                                {profile.mobileNumber || 'Registered'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Copy & Instructions */}
                                <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">Share code with friends</p>
                                        <p className="text-[11px] text-slate-400 truncate">Friends can enter this code in Invite Friend to connect</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(userCode, 'quickCode')}
                                        className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                    >
                                        {copiedField === 'quickCode' ? (
                                            <>
                                                <Check size={14} /> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} /> Copy Code
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: QR CODE */}
                        {activeTab === 'qr' && (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 text-center"
                            >
                                <div className="inline-block p-6 bg-white rounded-3xl shadow-2xl shadow-cyan-500/10 border border-slate-200">
                                    {/* High fidelity SVG QR Graphic */}
                                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
                                            {/* Corner Markers */}
                                            <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                                            <rect x="12" y="12" width="12" height="12" rx="2" fill="currentColor" />

                                            <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                                            <rect x="76" y="12" width="12" height="12" rx="2" fill="currentColor" />

                                            <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                                            <rect x="12" y="76" width="12" height="12" rx="2" fill="currentColor" />

                                            {/* Stylized QR Data Blocks */}
                                            <rect x="36" y="8" width="8" height="6" rx="1" />
                                            <rect x="48" y="8" width="6" height="6" rx="1" />
                                            <rect x="58" y="10" width="6" height="4" rx="1" />

                                            <rect x="36" y="18" width="6" height="6" rx="1" />
                                            <rect x="46" y="18" width="8" height="8" rx="1" />
                                            <rect x="58" y="18" width="6" height="6" rx="1" />

                                            <rect x="8" y="36" width="6" height="6" rx="1" />
                                            <rect x="18" y="36" width="8" height="6" rx="1" />
                                            <rect x="28" y="40" width="6" height="6" rx="1" />

                                            <rect x="68" y="36" width="8" height="6" rx="1" />
                                            <rect x="80" y="38" width="6" height="8" rx="1" />
                                            <rect x="90" y="36" width="5" height="6" rx="1" />

                                            <rect x="8" y="48" width="6" height="8" rx="1" />
                                            <rect x="18" y="48" width="6" height="6" rx="1" />
                                            <rect x="28" y="52" width="6" height="6" rx="1" />

                                            <rect x="68" y="48" width="6" height="6" rx="1" />
                                            <rect x="78" y="52" width="8" height="6" rx="1" />
                                            <rect x="90" y="48" width="5" height="8" rx="1" />

                                            <rect x="36" y="68" width="6" height="8" rx="1" />
                                            <rect x="46" y="72" width="8" height="6" rx="1" />
                                            <rect x="58" y="68" width="6" height="8" rx="1" />

                                            <rect x="36" y="82" width="8" height="6" rx="1" />
                                            <rect x="48" y="84" width="6" height="6" rx="1" />
                                            <rect x="58" y="82" width="6" height="6" rx="1" />
                                            <rect x="68" y="82" width="6" height="6" rx="1" />
                                            <rect x="78" y="80" width="8" height="6" rx="1" />
                                        </svg>

                                        {/* Center Brand Badge */}
                                        <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                                            <span className="text-slate-950 font-black text-lg">D</span>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-slate-900 font-mono font-black text-sm tracking-wider">
                                        {userCode}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs text-slate-400">
                                        Scan or share this code to settle bills or add each other directly.
                                    </p>

                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={handleShare}
                                            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                                        >
                                            {shareSuccess ? <Check size={16} /> : <Share2 size={16} />}
                                            {shareSuccess ? 'Shared!' : 'Share Pass & Code'}
                                        </button>
                                        <button
                                            onClick={() => handleCopy(userCode, 'qrCode')}
                                            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/10 active:scale-95"
                                        >
                                            {copiedField === 'qrCode' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                            {copiedField === 'qrCode' ? 'Copied!' : 'Copy Code'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: DETAILS & STATS */}
                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Network Friends</p>
                                            <p className="text-lg font-black text-white">{profile.friendsCount ?? 0}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <Layers size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Active Squads</p>
                                            <p className="text-lg font-black text-white">{profile.groupsCount ?? 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Fields */}
                                <div className="space-y-2">
                                    {/* Unique Code Field */}
                                    <div className="p-3.5 bg-slate-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                <Sparkles size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Unique Udhar Tag / Code</p>
                                                <p className="text-xs font-mono font-black text-emerald-400 truncate">{userCode}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(userCode, 'codeField')}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                            title="Copy"
                                        >
                                            {copiedField === 'codeField' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    {/* Full Name */}
                                    <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                                <User size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                                                <p className="text-xs font-bold text-white truncate">{profile.name || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(profile.name || '', 'nameField')}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                            title="Copy"
                                        >
                                            {copiedField === 'nameField' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    {/* Email */}
                                    <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                                <Mail size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                                                <p className="text-xs font-bold text-white truncate">{profile.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(profile.email || '', 'emailField')}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                            title="Copy"
                                        >
                                            {copiedField === 'emailField' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    {/* Mobile */}
                                    <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                                <Phone size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Mobile Number</p>
                                                <p className="text-xs font-mono font-bold text-white truncate">{profile.mobileNumber || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(profile.mobileNumber || '', 'mobileField')}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                            title="Copy"
                                        >
                                            {copiedField === 'mobileField' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 border-t border-white/5 flex items-center justify-between gap-3">
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="px-4 py-2.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 font-bold text-xs flex items-center gap-2 transition-all"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default UserProfileModal;
