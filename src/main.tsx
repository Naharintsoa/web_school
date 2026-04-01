import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { SchoolYearProvider } from './contexts/SchoolYearContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* AuthProvider en premier : useAuth et useAuthContext sont disponibles partout */}
    <AuthProvider>
      <SchoolYearProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SchoolYearProvider>
    </AuthProvider>
  </StrictMode>
);
