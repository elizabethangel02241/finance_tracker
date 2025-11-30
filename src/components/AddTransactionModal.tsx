import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  icon: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAccounts();
      loadCategories();
    }
  }, [isOpen, user, type]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, name, icon')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('name');

    if (data) {
      setAccounts(data);
      if (data.length > 0 && !accountId) {
        setAccountId(data[0].id);
      }
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, type, icon')
      .eq('type', type)
      .or(`user_id.eq.${user!.id},is_system.eq.true`)
      .order('name');

    if (data) {
      setCategories(data);
      if (data.length > 0 && !categoryId) {
        setCategoryId(data[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId || !amount) return;

    setLoading(true);

    try {
      const { error: txnError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId || null,
        amount: parseFloat(amount),
        type,
        merchant: merchant || null,
        description: description || null,
        transaction_date: date,
        source: 'manual',
      });

      if (txnError) throw txnError;

      const { data: accountData } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accountData) {
        const currentBalance = Number(accountData.balance);
        const newBalance = type === 'income'
          ? currentBalance + parseFloat(amount)
          : currentBalance - parseFloat(amount);

        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', accountId);
      }

      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setMerchant('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-3 rounded-lg border-2 transition ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Expense</div>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-3 rounded-lg border-2 transition ${
                  type === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Income</div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant / Source {type === 'expense' ? '(Optional)' : ''}
            </label>
            <input
              id="merchant"
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={type === 'expense' ? 'e.g., Starbucks' : 'e.g., Salary, Freelance'}
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Add notes..."
            />
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
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
