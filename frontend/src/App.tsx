import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import CreateItem from './pages/CreateItem';
import Trades from './pages/Trades';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import { BillingCancel, BillingSuccess } from './pages/BillingResult';
import { PrivacyPage, SafetyPage, TermsPage } from './pages/Legal';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-secondary-50">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="items" element={<Items />} />
                <Route path="items/:id" element={<ItemDetail />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="billing/success" element={<BillingSuccess />} />
                <Route path="billing/cancel" element={<BillingCancel />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="safety" element={<SafetyPage />} />
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="create-item"
                  element={
                    <ProtectedRoute>
                      <CreateItem />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="trades"
                  element={
                    <ProtectedRoute>
                      <Trades />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
