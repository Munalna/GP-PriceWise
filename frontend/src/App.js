import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Import pages
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Costs from './pages/Costs';
import Seasons from './pages/Seasons';
//import PricingRules from './pages/PricingRules';
//import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes (No Layout) */}
        <Route path="/signup" element={<Signup />} />
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