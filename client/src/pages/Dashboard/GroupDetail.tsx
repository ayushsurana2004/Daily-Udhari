import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSummary from '../../components/features/dashboard/DashboardSummary';
import ExpenseList from '../../components/features/dashboard/ExpenseList';
import ExpenseForm from '../../components/ExpenseForm';
import SettlementModal from '../../components/SettlementModal';
import ExitGroupModal from '../../components/ExitGroupModal';
import SimplifiedDebts from '../../components/SimplifiedDebts';
import ApiService from '../../services/ApiService';

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { refreshTrigger, handleRefresh } = useOutletContext<{ refreshTrigger: number, handleRefresh: () => void }>();
    const [group, setGroup] = useState<any>(null);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await ApiService.get(`/groups`);
                const g = res.data.find((item: any) => item.id === parseInt(id || '0'));
                setGroup(g);
            } catch (err) {
                console.error('Failed to fetch group');
            }
        };
        fetchGroup();
    }, [id, refreshTrigger]);

    if (!group) return <div className="text-white p-8">Loading Squad...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
        >
            <DashboardSummary
                title={group.name}
                onAddExpense={() => setShowExpenseForm(true)}
                onSettleUp={() => setShowSettlementModal(true)}
                onExitGroup={() => setShowExitModal(true)}
                groupId={parseInt(id || '0')}
                refreshTrigger={refreshTrigger}
            />

            <div className="mt-12">
                <SimplifiedDebts groupId={parseInt(id || '0')} refreshTrigger={refreshTrigger} />
            </div>

            <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black tracking-tighter text-white">Group Ledger</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-8 opacity-50" />
                </div>
                <ExpenseList groupId={parseInt(id || '0')} refreshTrigger={refreshTrigger} />
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showExpenseForm && (
                    <ExpenseForm
                        initialGroupId={parseInt(id || '0')}
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
                        groupId={parseInt(id || '0')}
                        onClose={() => {
                            setShowSettlementModal(false);
                            handleRefresh();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showExitModal && (
                    <ExitGroupModal
                        groupId={parseInt(id || '0')}
                        groupName={group.name}
                        onClose={() => setShowExitModal(false)}
                        onOpenSettleModal={() => setShowSettlementModal(true)}
                        onSuccess={() => {
                            setShowExitModal(false);
                            handleRefresh();
                            navigate('/');
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GroupDetail;
