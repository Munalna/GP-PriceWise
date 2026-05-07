import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';  
import './index.css';
import App from './App';

// 🟢 1. استدعاء مزود الصلاحيات (تأكدي أن المسار صحيح حسب مجلدات مشروعك)
import { AuthProvider } from './context/AuthContext'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 🟢 2. تغليف التطبيق بالكامل بـ AuthProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);