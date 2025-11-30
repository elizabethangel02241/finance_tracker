import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
}

interface RecentTransaction {
  id: string;
  amount: number;
  type: string;
  merchant: string | null;
  category_name: string;
  transaction_date: string;
  account_name: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    savingsRate: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [accountsRes, transactionsRes, recentRes] = await Promise.all([
      supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .eq('is_active', true),

      supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('transaction_date', startOfMonth),

      supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          merchant,
          transaction_date,
          categories(name),
          accounts(name)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(5)
    ]);

    if (accountsRes.data) {
      const totalBalance = accountsRes.data.reduce((sum, acc) => sum + Number(acc.balance), 0);
      setStats(prev => ({ ...prev, totalBalance }));
    }

    if (transactionsRes.data) {
      const income = transactionsRes.data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = transactionsRes.data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

      setStats(prev => ({
        ...prev,
        monthlyIncome: income,
        monthlyExpense: expense,
        savingsRate: Math.max(0, savingsRate),
      }));
    }

    if (recentRes.data) {
      const formatted = recentRes.data.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        merchant: t.merchant,
        category_name: t.categories?.name || 'Uncategorized',
        transaction_date: t.transaction_date,
        account_name: t.accounts?.name || 'Unknown',
      }));
      setRecentTransactions(formatted);
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
      month: 'short',
      day: 'numeric',
    });
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
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wallet className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</div>
          <div className="text-sm text-gray-600 mt-1">Total Balance</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyIncome)}</div>
          <div className="text-sm text-gray-600 mt-1">This Month Income</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyExpense)}</div>
          <div className="text-sm text-gray-600 mt-1">This Month Expense</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <PiggyBank className="text-amber-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.savingsRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">Savings Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions yet. Add your first transaction!</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="text-emerald-600" size={20} />
                      ) : (
                        <ArrowDownRight className="text-red-600" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.merchant || transaction.category_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.account_name} • {formatDate(transaction.transaction_date)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl p-6 shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">Quick Insights</h3>
          <div className="space-y-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">{formatCurrency(stats.monthlyIncome - stats.monthlyExpense)}</div>
              <div className="text-sm opacity-90">Net Cash Flow This Month</div>
            </div>

            {stats.monthlyExpense > stats.monthlyIncome && (
              <div className="bg-red-500 bg-opacity-30 rounded-lg p-4 backdrop-blur-sm border border-red-300">
                <div className="font-semibold mb-1">Spending Alert</div>
                <div className="text-sm opacity-90">
                  You've spent more than you earned this month. Consider reviewing your expenses.
                </div>
              </div>
            )}

            {stats.savingsRate >= 20 && (
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="font-semibold mb-1">Great Job!</div>
                <div className="text-sm opacity-90">
                  You're saving {stats.savingsRate.toFixed(0)}% of your income. Keep it up!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
