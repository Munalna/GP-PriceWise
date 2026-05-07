import 'bootstrap/dist/css/bootstrap.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🟢 1. استدعاء الـ AuthProvider (تأكدي من مسار الملف)
import { AuthProvider } from './context/AuthContext.jsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 🟢 2. تغليف التطبيق بالكامل ليتمكن من قراءة بيانات المستخدم */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)