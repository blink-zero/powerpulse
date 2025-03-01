import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import SettingsLoader from './components/SettingsLoader';

// Pages
import Dashboard from './pages/Dashboard';
import UPSSystemsPage from './pages/UPSSystemsPage';
import NUTServersPage from './pages/NUTServersPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupPage from './pages/SetupPage';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

const App = () => {
  const { user, loading, checkFirstTimeSetup } = useAuth();
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const isFirstTime = await checkFirstTimeSetup();
        setIsFirstTimeSetup(isFirstTime);
      } catch (error) {
        console.error('Error checking setup:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [checkFirstTimeSetup]);

  // Update isFirstTimeSetup when user changes
  useEffect(() => {
    if (user) {
      // If we have a user, it's definitely not first time setup
      setIsFirstTimeSetup(false);
    }
  }, [user]);

  if (loading || checkingSetup) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsLoader />
        <Routes>
      {isFirstTimeSetup ? (
        <>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ups-systems" element={<UPSSystemsPage />} />
              <Route path="/servers" element={<NUTServersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </>
      )}
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
