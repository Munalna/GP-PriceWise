import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';

// App pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Costs from './pages/Costs';
import Seasons from './pages/Seasons';
//import PricingRules from './pages/PricingRules';
//import Reports from './pages/Reports';
//import Analytics from './pages/Analytics';

function App() {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("supabase_token");
    return saved ? JSON.parse(saved) : null;
  });

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected App Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><MainLayout><Products /></MainLayout></ProtectedRoute>} />
        <Route path="/costs" element={<ProtectedRoute><MainLayout><Costs /></MainLayout></ProtectedRoute>} />
        <Route path="/seasons" element={<ProtectedRoute><MainLayout><Seasons /></MainLayout></ProtectedRoute>} />
    

        {/* Any wrong route */}
        <Route path="*" element={<Navigate to="/login" replace />} />

          <Route path="/verify-email" element={<VerifyEmail />} />  {/* ← ADD THIS */}

        
        {/* Redirect root to signup */}
        <Route path="/" element={<Navigate to="/signup" />} />
        
        {/* Protected Routes (With Layout) */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
        <Route path="/costs" element={<MainLayout><Costs /></MainLayout>} />
      <Route path="/seasons" element={<Seasons />} /> 
      </Routes>
    </Router>
  );
}

export default App;