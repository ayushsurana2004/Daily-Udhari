import React from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import UserProfileModal from '../components/UserProfileModal';
import ApiService from '../services/ApiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard, TrendingUp, User, Users } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    const [currentUser, setCurrentUser] = React.useState<any>(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    });

    React.useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await ApiService.get('/users/me');
                    if (res.data) {
                        setCurrentUser(res.data);
                        localStorage.setItem('user', JSON.stringify({
                            ...JSON.parse(localStorage.getItem('user') || '{}'),
                            ...res.data
                        }));
                    }
                } catch (e) {
                    // Fall back to cached user in localStorage
                }
            }
        };
        fetchUserData();
    }, [refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login';
    };

    const userInitials = (currentUser.name || 'User')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const userCode = currentUser.userCode || (currentUser.id ? `DU-${String(currentUser.id).padStart(5, '0')}` : 'DU-00001');
    const firstName = (currentUser.name || 'Friend').split(' ')[0];

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30 mesh-gradient">
            {/* Ultra Premium Background Decoratives */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -45, 0],
                        x: [0, -80, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-cyan-500/10 blur-[200px] rounded-full"
                />
                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Mobile Header with safe-top */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 z-40 safe-top">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-slate-950 font-black text-lg">D</span>
                    </div>
                    <span className="text-base font-black tracking-tight">Daily Udhari</span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* User Profile Avatar Icon on Mobile */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsProfileOpen(true)}
                        className="p-1 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                        title="View Profile & Code"
                        data-testid="mobile-profile-btn"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[1.5px] shadow-sm shadow-emerald-500/25">
                                <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center font-black text-xs text-emerald-400">
                                    {userInitials}
                                </div>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 bg-white/5 rounded-2xl border border-white/10 text-emerald-500"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </motion.button>
                </div>
            </header>

            <Sidebar
                onLogout={handleLogout}
                onOpenProfile={() => setIsProfileOpen(true)}
                refreshTrigger={refreshTrigger}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Desktop Top Header Bar with Profile Icon */}
                <header className="hidden md:flex items-center justify-between px-16 py-5 border-b border-white/5 bg-slate-950/20 backdrop-blur-xl z-30">
                    <div>
                        <h2 className="text-sm font-bold text-slate-300">
                            Welcome back, <span className="text-white font-black">{firstName}</span> 👋
                        </h2>
                        <p className="text-[11px] text-slate-500">Simplify group expenses and dual-key settlements</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Icon & Code Button */}
                        <motion.button
                            whileHover={{ scale: 1.02, borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsProfileOpen(true)}
                            className="flex items-center gap-3 py-1.5 px-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 transition-all text-left shadow-lg shadow-black/20 group cursor-pointer"
                            data-testid="desktop-profile-btn"
                        >
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[1.5px] shadow-sm shadow-emerald-500/20">
                                    <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center font-black text-xs text-emerald-400">
                                        {userInitials}
                                    </div>
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-[0_0_6px_#10b981]" />
                            </div>

                            <div className="text-left">
                                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {currentUser.name || 'Your Account'}
                                </p>
                                <p className="text-[10px] font-mono font-bold text-emerald-400/90 tracking-wider">
                                    {userCode}
                                </p>
                            </div>
                        </motion.button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar relative px-3.5 py-4 sm:px-6 md:px-16 md:py-12 pb-24 md:pb-12">
                    <Outlet context={{ refreshTrigger, handleRefresh, onOpenProfile: () => setIsProfileOpen(true) }} />
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 z-40 safe-bottom px-2 py-1 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-[10px] mt-0.5 tracking-tight font-bold">Home</span>
                </NavLink>

                <NavLink
                    to="/activity"
                    className={({ isActive }) => `flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <TrendingUp size={20} />
                    <span className="text-[10px] mt-0.5 tracking-tight font-bold">Activity</span>
                </NavLink>

                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex flex-col items-center py-1.5 px-3 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all"
                >
                    <Users size={20} />
                    <span className="text-[10px] mt-0.5 tracking-tight font-bold">Squads</span>
                </button>

                <NavLink
                    to="/friends"
                    className={({ isActive }) => `flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <User size={20} />
                    <span className="text-[10px] mt-0.5 tracking-tight font-bold">Friends</span>
                </NavLink>
            </nav>

            {/* User Profile & Code Details Modal */}
            <AnimatePresence>
                {isProfileOpen && (
                    <UserProfileModal
                        onClose={() => setIsProfileOpen(false)}
                        onLogout={handleLogout}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
