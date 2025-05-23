// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { EnhancedSettingsProvider } from "./hooks/use-enhanced-settings";
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="jaylink-theme">
        <EnhancedSettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </EnhancedSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);