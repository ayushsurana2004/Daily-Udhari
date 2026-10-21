import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Dashboard/Overview';
import GroupDetail from './pages/Dashboard/GroupDetail';
import Activity from './pages/Dashboard/Activity';
import Friends from './pages/Dashboard/Friends';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AnimatePresence } from 'framer-motion';

function App() {
    return (
        <Router>
            <AnimatePresence mode="wait">
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={<LoginPage onLoginSuccess={() => window.location.href = '/'} />}
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Overview />} />
                        <Route path="activity" element={<Activity />} />
                        <Route path="friends" element={<Friends />} />
                        <Route path="groups/:id" element={<GroupDetail />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </Router>
    );
}

export default App;
