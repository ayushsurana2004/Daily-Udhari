import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import InviteFriendModal from '../../components/InviteFriendModal';
import ApiService from '../../services/ApiService';

interface Friend {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    balance: number;
}

const Friends: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const fetchFriends = async () => {
        try {
            const res = await ApiService.get('/friends');
            setFriends(res.data);
        } catch (err) {
            console.error('Failed to fetch friends');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);



    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-12">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-rose-500/20 shrink-0">
                            <User size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">Your Network</h1>
                            <p className="text-rose-500/70 font-black uppercase tracking-[2px] sm:tracking-[3px] text-[9px] sm:text-[10px]">Connected Personnel</p>
                        </div>
                    </div>

                    <Button leftIcon={<UserPlus size={18} />} variant="primary" className="w-full sm:w-auto h-12 !justify-center" onClick={() => setIsInviteOpen(true)}>
                        Invite Friend
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                    {isLoading ? (
                        <div className="text-white col-span-full">Loading network...</div>
                    ) : friends.length > 0 ? (
                        friends.map(friend => (
                            <Card key={friend.id} className="flex items-center gap-3 sm:gap-4 !p-3.5 sm:!p-5 hover:border-rose-500/30 transition-all group">
                                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-800 flex items-center justify-center text-base sm:text-xl font-black text-slate-500 group-hover:bg-rose-500 group-hover:text-slate-950 transition-all shrink-0">
                                    {friend.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold text-sm sm:text-base truncate">{friend.name}</h4>
                                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">{friend.mobileNumber}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {friend.balance > 0 ? (
                                        <>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase mb-0.5 sm:mb-1">Owes you</p>
                                            <span className="text-emerald-400 text-xs sm:text-sm font-black tracking-tighter">₹ {friend.balance.toFixed(2)}</span>
                                        </>
                                    ) : friend.balance < 0 ? (
                                        <>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase mb-0.5 sm:mb-1">You owe</p>
                                            <span className="text-rose-400 text-xs sm:text-sm font-black tracking-tighter">₹ {Math.abs(friend.balance).toFixed(2)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase mb-0.5 sm:mb-1">Status</p>
                                            <span className="text-slate-500 text-xs sm:text-sm font-black tracking-tighter">Settled Up</span>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-slate-500 col-span-full">No connected personnel found. Join a squad to build your network.</div>
                    )}

                    {/* Search Placeholder */}
                    <Card className="flex md:col-span-2 lg:col-span-3 items-center justify-center border-dashed border-white/5 bg-white/[0.02]">
                        <div className="text-center p-12">
                            <Search size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                            <h3 className="text-slate-600 font-black uppercase tracking-[4px] text-sm">Expand Grid</h3>
                            <p className="text-slate-700 text-xs mt-2">Search for more allies to sync wallets</p>
                        </div>
                    </Card>
                </div>
            </motion.div>

            <AnimatePresence>
                {isInviteOpen && (
                    <InviteFriendModal
                        onClose={() => setIsInviteOpen(false)}
                        onSuccess={() => {
                            setIsInviteOpen(false);
                            fetchFriends();
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Friends;
