import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { InspectorDashboard } from './pages/InspectorDashboard';

const MainApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === 'assistant_engineer') {
    return <InspectorDashboard />;
  }

  return <CitizenDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
