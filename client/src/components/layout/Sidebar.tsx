import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, User, LogOut, TrendingUp, Plus, UserPlus, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import ApiService from '../../services/ApiService';
import CreateGroupModal from '../CreateGroupModal';
import AddMemberModal from '../AddMemberModal';

interface SidebarProps {
    onLogout: () => void;
    onOpenProfile?: () => void;
    selectedGroupId?: number | null;
    onGroupSelect?: (id: number | null) => void;
    onCreateGroup?: () => void;
    onInviteMember?: () => void;
    refreshTrigger?: number;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    onLogout,
    onOpenProfile,
    selectedGroupId: propSelectedGroupId,
    onGroupSelect,
    onCreateGroup,
    onInviteMember,
    refreshTrigger,
    isOpen,
    onClose
}) => {
    const [groups, setGroups] = React.useState<any[]>([]);
    const [groupMembers, setGroupMembers] = React.useState<any[]>([]);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const currentUser = React.useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    }, [refreshTrigger]);

    const userInitials = (currentUser.name || 'User')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const userCode = currentUser.userCode || (currentUser.id ? `DU-${String(currentUser.id).padStart(5, '0')}` : 'DU-00001');

    // Extract groupId from path if it exists: /groups/:id
    // If prop is provided, use it, otherwise fallback to URL
    const selectedGroupId = propSelectedGroupId !== undefined
        ? propSelectedGroupId
        : (location.pathname.startsWith('/groups/')
            ? parseInt(location.pathname.split('/')[2])
            : null);

    const fetchGroups = async () => {
        try {
            const res = await ApiService.get('/groups');
            if (Array.isArray(res.data)) {
                setGroups(res.data);
            } else {
                setGroups([]);
                console.error('Invalid response format for groups');
            }
        } catch (err) {
            console.error('Failed to fetch groups');
        }
    };

    React.useEffect(() => {
        fetchGroups();
    }, [refreshTrigger]);

    React.useEffect(() => {
        const fetchMembers = async () => {
            if (selectedGroupId && typeof selectedGroupId === 'number') {
                try {
                    const res = await ApiService.get(`/groups/${selectedGroupId}/members`);
                    setGroupMembers(res.data);
                } catch (err) {
                    console.error('Failed to fetch group members');
                }
            } else {
                setGroupMembers([]);
            }
        };
        fetchMembers();
    }, [selectedGroupId, refreshTrigger]);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
        { icon: <TrendingUp size={20} />, label: 'Activity', path: '/activity' },
        { icon: <User size={20} />, label: 'Friends', path: '/friends' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={false}
                animate={{
                    x: isOpen || window.innerWidth >= 768 ? 0 : -300,
                    opacity: isOpen || window.innerWidth >= 768 ? 1 : 0
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-950/20 backdrop-blur-2xl border-r border-white/5 flex flex-col h-full overflow-hidden z-[60] md:z-10 md:opacity-100 md:translate-x-0 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100'}`}
            >
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-50" />

                <div className="p-8 pb-6">
                    <Link to="/" className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ rotate: 12, scale: 1.1 }}
                            className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                        >
                            <span className="text-slate-950 font-black text-2xl">D</span>
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter text-white">Daily Udhari</h2>
                            <p className="text-[9px] text-emerald-500/70 font-black uppercase tracking-[2px]">Premium Edition</p>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4 opacity-50">Discovery</p>
                        {menuItems.map((item, i) => (
                            <NavLink
                                key={i}
                                to={item.path}
                                className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative ${isActive ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full"
                                            />
                                        )}
                                        <span className={isActive ? 'text-emerald-400' : 'opacity-50 group-hover:opacity-100 transition-opacity'}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="px-4 flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] opacity-50">Your Squads</p>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20"
                                data-testid="create-group-btn"
                            >
                                <Plus size={14} />
                            </motion.button>
                        </div>
                        {groups.length === 0 ? (
                            <div className="px-4 py-8 text-center bg-white/2 rounded-3xl border border-dashed border-white/5">
                                <Users size={24} className="mx-auto text-slate-700 mb-2 opacity-50" />
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">No active groups</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {groups.map((group) => (
                                    <div key={group.id} className="space-y-1">
                                        <NavLink
                                            to={`/groups/${group.id}`}
                                            className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${isActive ? 'bg-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border-slate-700'}`} />
                                                    <span className="text-sm font-black tracking-tight flex-1 text-left">{group.name}</span>
                                                    {isActive && (
                                                        <motion.button
                                                            initial={{ scale: 0, rotate: -45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onInviteMember?.();
                                                                setIsAddMemberOpen(true);
                                                            }}
                                                            className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                                        >
                                                            <UserPlus size={14} />
                                                        </motion.button>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>

                                        <AnimatePresence>
                                            {selectedGroupId === group.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden bg-slate-950/30 mx-2 rounded-2xl border border-white/5"
                                                >
                                                    <div className="p-3 space-y-2">
                                                        <p className="px-2 text-[9px] font-black text-slate-600 uppercase tracking-[2px] mb-2">Member Profiles</p>
                                                        {groupMembers.map(member => {
                                                            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                                            const isMe = member.id === currentUser.id;
                                                            return (
                                                                <div key={member.id} className={`flex items-center gap-3 py-2 px-2 rounded-xl transition-all group/member ${isMe ? 'bg-emerald-500/5 border border-emerald-500/10' : 'hover:bg-white/5'}`}>
                                                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black border transition-all ${isMe ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-500 border-white/5 group-hover/member:bg-emerald-500 group-hover/member:text-slate-950 group-hover/member:border-emerald-400'}`}>
                                                                        {member.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col flex-1 min-w-0">
                                                                        <span className={`text-[11px] font-bold transition-colors ${isMe ? 'text-emerald-400' : 'text-slate-400 group-hover/member:text-slate-200'}`}>
                                                                            {member.name} {isMe && <span className="text-[8px] text-emerald-500/60">(You)</span>}
                                                                        </span>
                                                                        <span className="text-[9px] text-slate-600 font-bold group-hover/member:text-slate-500">Active now</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 space-y-3">
                    {/* User Profile Quick Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenProfile}
                        className="w-full p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 flex items-center gap-3 transition-all text-left group"
                        data-testid="sidebar-profile-btn"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[1.5px] shadow-md shadow-emerald-500/20">
                                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-sm text-emerald-400">
                                    {userInitials}
                                </div>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                                    {currentUser.name || 'Your Profile'}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400/80 tracking-wider">
                                {userCode}
                            </span>
                        </div>
                        <div className="p-1 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                            <ChevronRight size={14} />
                        </div>
                    </motion.button>

                    <Button
                        variant="ghost"
                        className="w-full !justify-start !px-4 hover:!text-rose-400 hover:!bg-rose-400/10 text-slate-500 rounded-2xl h-12 transition-all duration-500"
                        onClick={onLogout}
                        leftIcon={<LogOut size={18} className="rotate-180" />}
                    >
                        Abandon Ship
                    </Button>
                </div>

                <AnimatePresence>
                    {isCreateGroupOpen && (
                        <CreateGroupModal
                            onClose={() => setIsCreateGroupOpen(false)}
                            onSuccess={() => {
                                setIsCreateGroupOpen(false);
                                fetchGroups();
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isAddMemberOpen && selectedGroupId && (
                        <AddMemberModal
                            groupId={selectedGroupId}
                            groupName={groups.find(g => g.id === selectedGroupId)?.name || 'Group'}
                            onClose={() => setIsAddMemberOpen(false)}
                            onSuccess={() => {
                                setIsAddMemberOpen(false);
                                // Refresh members list
                                ApiService.get(`/groups/${selectedGroupId}/members`).then(res => setGroupMembers(res.data));
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};

export default Sidebar;
