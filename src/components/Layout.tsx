import { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  TrendingUp,
  Settings,
  Menu,
  X,
  Plus,
  Bell,
  LogOut,
  BarChart3,
  Repeat,
  Zap,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onQuickAdd: () => void;
}

export function Layout({ children, currentView, onViewChange, onQuickAdd }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', name: 'Accounts', icon: Wallet },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'budgets', name: 'Budgets', icon: Target },
    { id: 'goals', name: 'Goals', icon: TrendingUp },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'subscriptions', name: 'Subscriptions', icon: Repeat },
    { id: 'loans', name: 'Loans', icon: TrendingDown },
    { id: 'investments', name: 'Investments', icon: Zap },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Finance Tracker</h1>
                <p className="text-xs text-gray-500">AI-Powered Budget Manager</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Sign Out"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`
            fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)] w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out z-30
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <button
        onClick={onQuickAdd}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center"
      >
        <Plus size={28} />
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
