/**
 * React Application Entry Point
 * Initializes React, mounts the application, and sets up providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BudgetProvider } from './context/BudgetContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationContainer from './components/notification/NotificationContainer.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import './styles/index.css';

// Create root and render application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BudgetProvider>
            <NotificationProvider>
              <App />
              <NotificationContainer />
            </NotificationProvider>
          </BudgetProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);