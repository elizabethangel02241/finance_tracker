import { useState, useEffect } from 'react';
import { Plus, Wallet, CreditCard, PiggyBank, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
  provider: string | null;
}

export function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading accounts:', error);
      return;
    }

    if (data) {
      setAccounts(data);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Wallet size={24} />;
      case 'credit_card':
        return <CreditCard size={24} />;
      case 'cash':
        return <PiggyBank size={24} />;
      default:
        return <Wallet size={24} />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Accounts</h2>
          <p className="text-gray-600 mt-1">Manage your wallets and accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Account</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-2">Total Balance</div>
        <div className="text-4xl font-bold mb-1">{formatCurrency(totalBalance)}</div>
        <div className="text-sm opacity-90">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Wallet size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">No accounts yet. Add your first account to get started!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
            >
              Add Account
            </button>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: account.color }}
                >
                  {getAccountTypeIcon(account.type)}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {getAccountTypeLabel(account.type)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">{account.name}</h3>
              {account.provider && (
                <p className="text-sm text-gray-500 mb-3">{account.provider}</p>
              )}
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</div>
            </div>
          ))
        )}
      </div>

      {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={loadAccounts} />}
    </div>
  );
}

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card' | 'upi'>('bank');
  const [provider, setProvider] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    { value: 'cash', label: 'Cash', icon: '💵', color: '#10b981' },
    { value: 'bank', label: 'Bank Account', icon: '🏦', color: '#3b82f6' },
    { value: 'credit_card', label: 'Credit Card', icon: '💳', color: '#f59e0b' },
    { value: 'upi', label: 'UPI', icon: '📱', color: '#8b5cf6' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const selectedType = accountTypes.find((t) => t.value === type);

      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name,
        type,
        provider: provider || null,
        balance: parseFloat(balance) || 0,
        icon: selectedType?.icon || '💳',
        color: selectedType?.color || '#10b981',
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map((accountType) => (
                <button
                  key={accountType.value}
                  type="button"
                  onClick={() => setType(accountType.value as any)}
                  className={`p-4 rounded-lg border-2 transition ${
                    type === accountType.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{accountType.icon}</div>
                  <div className="text-sm font-medium">{accountType.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Account Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., HDFC Savings"
              required
            />
          </div>

          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
              Provider (Optional)
            </label>
            <input
              id="provider"
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., HDFC Bank, PhonePe"
            />
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
              Current Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
