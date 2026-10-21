import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import DashboardSummary from '../../components/features/dashboard/DashboardSummary';
import ExpenseList from '../../components/features/dashboard/ExpenseList';
import ExpenseForm from '../../components/ExpenseForm';
import SettlementModal from '../../components/SettlementModal';

const Overview: React.FC = () => {
    const { refreshTrigger, handleRefresh } = useOutletContext<{ refreshTrigger: number, handleRefresh: () => void }>();
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <DashboardSummary
                onAddExpense={() => setShowExpenseForm(true)}
                onSettleUp={() => setShowSettlementModal(true)}
                groupId={null}
                refreshTrigger={refreshTrigger}
            />

            <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black tracking-tighter text-white">Latest Transactions</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-8 opacity-50" />
                </div>
                <ExpenseList groupId={null} refreshTrigger={refreshTrigger} />
            </div>

            <AnimatePresence>
                {showExpenseForm && (
                    <ExpenseForm
                        onClose={() => setShowExpenseForm(false)}
                        onSuccess={() => {
                            setShowExpenseForm(false);
                            handleRefresh();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettlementModal && (
                    <SettlementModal
                        onClose={() => {
                            setShowSettlementModal(false);
                            handleRefresh();
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Overview;
