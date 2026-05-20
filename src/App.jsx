import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import './index.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AccountCatalog = lazy(() => import('./pages/AccountCatalog'));
const JournalEntries = lazy(() => import('./pages/JournalEntries'));
const NewEntry = lazy(() => import('./pages/NewEntry'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Reports = lazy(() => import('./pages/Reports'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Cargando ERP...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<div className="loading-screen">Cargando...</div>}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AccountCatalog /></ProtectedRoute>} />
        <Route path="/new-entry" element={<ProtectedRoute><NewEntry /></ProtectedRoute>} />
        <Route path="/entries" element={<ProtectedRoute><JournalEntries /></ProtectedRoute>} />
        <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <BrandProvider>
          <AppContent />
        </BrandProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
