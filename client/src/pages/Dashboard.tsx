import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import DashboardSummary from '../components/features/dashboard/DashboardSummary';
import ExpenseList from '../components/features/dashboard/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import SettlementModal from '../components/SettlementModal';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [sidebarRefresh, setSidebarRefresh] = useState(0);

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30">
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

            <Sidebar
                onLogout={onLogout}
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
                onCreateGroup={() => setShowCreateGroupModal(true)}
                onInviteMember={() => setShowAddMemberModal(true)}
                refreshTrigger={sidebarRefresh}
            />

            <main className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-12 md:px-16 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <DashboardSummary
                        onAddExpense={() => setShowExpenseForm(true)}
                        onSettleUp={() => setShowSettlementModal(true)}
                        groupId={selectedGroupId}
                    />

                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tighter text-white">Latest Transactions</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-8 opacity-50" />
                        </div>
                        <ExpenseList groupId={selectedGroupId} />
                    </div>
                </motion.div>
            </main>

            <AnimatePresence>
                {showExpenseForm && (
                    <ExpenseForm
                        initialGroupId={selectedGroupId || undefined}
                        onClose={() => setShowExpenseForm(false)}
                        onSuccess={() => {
                            setShowExpenseForm(false);
                            // We might also want to trigger an expense list refresh here, but sticking to group refresh for now
                            setSidebarRefresh(prev => prev + 1);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettlementModal && (
                    <SettlementModal onClose={() => setShowSettlementModal(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCreateGroupModal && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroupModal(false)}
                        onSuccess={() => {
                            setShowCreateGroupModal(false);
                            setSidebarRefresh(prev => prev + 1);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAddMemberModal && selectedGroupId && (
                    <AddMemberModal
                        groupId={selectedGroupId}
                        groupName={"Current Group"}
                        onClose={() => setShowAddMemberModal(false)}
                        onSuccess={() => {
                            setShowAddMemberModal(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
