import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  merchant: string | null;
  description: string | null;
  transaction_date: string;
  category_name: string;
  category_icon: string;
  account_name: string;
}

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        type,
        merchant,
        description,
        transaction_date,
        categories(name, icon),
        accounts(name)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    if (data) {
      const formatted = data.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        merchant: t.merchant,
        description: t.description,
        transaction_date: t.transaction_date,
        category_name: t.categories?.name || 'Uncategorized',
        category_icon: t.categories?.icon || '📦',
        account_name: t.accounts?.name || 'Unknown',
      }));
      setTransactions(formatted);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || t.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-600 mt-1">View and manage all your transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Total Expense</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Net</div>
          <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || filterType !== 'all'
                ? 'No transactions found matching your filters'
                : 'No transactions yet. Add your first transaction!'}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="text-emerald-600" size={24} />
                      ) : (
                        <ArrowDownRight className="text-red-600" size={24} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <span>{transaction.category_icon}</span>
                        <span>{transaction.merchant || transaction.category_name}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {transaction.account_name} • {formatDate(transaction.transaction_date)}
                      </div>
                      {transaction.description && (
                        <div className="text-sm text-gray-600 mt-1">{transaction.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
