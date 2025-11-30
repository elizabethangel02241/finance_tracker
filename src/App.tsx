import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Accounts } from './components/Accounts';
import { Transactions } from './components/Transactions';
import { Budgets } from './components/Budgets';
import { Goals } from './components/Goals';
import { Reports } from './components/Reports';
import { Subscriptions } from './components/Subscriptions';
import { Loans } from './components/Loans';
import { Investments } from './components/Investments';
import { Settings } from './components/Settings';
import { AddTransactionModal } from './components/AddTransactionModal';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'goals':
        return <Goals />;
      case 'reports':
        return <Reports />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'loans':
        return <Loans />;
      case 'investments':
        return <Investments />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        onQuickAdd={() => setShowAddTransaction(true)}
      >
        {renderView()}
      </Layout>
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={() => {
          setShowAddTransaction(false);
          if (currentView === 'dashboard' || currentView === 'transactions') {
            window.location.reload();
          }
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
