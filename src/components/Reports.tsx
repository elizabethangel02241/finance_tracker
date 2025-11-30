import { useState, useEffect } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CategoryData {
  name: string;
  value: number;
  icon: string;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [aiInsights, setAiInsights] = useState<string>('');

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

  useEffect(() => {
    loadReportsData();
  }, [user]);

  const loadReportsData = async () => {
    if (!user) return;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [transactionsRes, categoriesRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, type, transaction_date, category_id, categories(name, icon)')
        .eq('user_id', user.id)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0]),

      supabase
        .from('categories')
        .select('id, name, icon')
        .eq('type', 'expense')
        .or(`user_id.eq.${user.id},is_system.eq.true`),
    ]);

    if (transactionsRes.data) {
      const txns = transactionsRes.data;

      const income = txns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = txns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const rate = income > 0 ? ((income - expense) / income) * 100 : 0;

      setTotalIncome(income);
      setTotalExpense(expense);
      setSavingsRate(Math.max(0, rate));

      const categorySpending: Record<string, { amount: number; icon: string }> = {};

      txns.forEach(t => {
        if (t.type === 'expense' && t.categories) {
          const catId = t.category_id;
          if (!categorySpending[catId]) {
            categorySpending[catId] = { amount: 0, icon: t.categories.icon };
          }
          categorySpending[catId].amount += Number(t.amount);
        }
      });

      const categoryArray = Object.entries(categorySpending).map(([catId, data]) => {
        const category = categoriesRes.data?.find(c => c.id === catId);
        return {
          name: category?.name || 'Other',
          value: data.amount,
          icon: data.icon,
        };
      }).sort((a, b) => b.value - a.value).slice(0, 8);

      setCategoryData(categoryArray);

      const monthlyData: Record<string, { income: number; expense: number }> = {};

      txns.forEach(t => {
        const date = new Date(t.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        if (t.type === 'income') {
          monthlyData[monthKey].income += Number(t.amount);
        } else {
          monthlyData[monthKey].expense += Number(t.amount);
        }
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const trend = sortedMonths.map(month => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        income: monthlyData[month].income,
        expense: monthlyData[month].expense,
      }));

      setMonthlyTrend(trend);
      generateAiInsights(income, expense, categoryArray);
    }

    setLoading(false);
  };

  const generateAiInsights = (income: number, expense: number, categories: CategoryData[]) => {
    let insights = '';

    if (expense > income) {
      insights += `⚠️ You're spending ${((expense / income - 1) * 100).toFixed(0)}% more than you earn. Consider reviewing your expenses.\n\n`;
    } else {
      insights += `✅ Great job! You're saving ${savingsRate.toFixed(0)}% of your income.\n\n`;
    }

    if (categories.length > 0) {
      const topCategory = categories[0];
      const percentage = (topCategory.value / expense) * 100;
      insights += `📊 Your top spending category is "${topCategory.name}" at ${percentage.toFixed(0)}% of expenses.\n\n`;
    }

    if (savingsRate > 30) {
      insights += '🌟 Excellent savings rate! Keep maintaining this disciplined approach.';
    } else if (savingsRate > 20) {
      insights += '💪 Good savings rate. Try to increase it by cutting non-essential expenses.';
    } else if (savingsRate > 10) {
      insights += '📈 Consider increasing your savings target for better financial security.';
    } else {
      insights += '⚡ Start building an emergency fund by reducing discretionary spending.';
    }

    setAiInsights(insights);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
          <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and trends</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition">
          <Download size={20} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Total Income</div>
          <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Total Expense</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Net Savings</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalIncome - totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Savings Rate</div>
          <div className="text-3xl font-bold text-amber-600">{savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{((cat.value / totalExpense) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${(cat.value / totalExpense) * 100}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">No expense data</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cat.name}</div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                        style={{ width: `${(cat.value / totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(cat.value)}</div>
                  <div className="text-xs text-gray-500">{((cat.value / totalExpense) * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h3>
        {monthlyTrend.length > 0 ? (
          <div className="space-y-4">
            {monthlyTrend.map((month, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 font-semibold">+{formatCurrency(month.income)}</span>
                    <span className="text-red-600 font-semibold">-{formatCurrency(month.expense)}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-12 bg-gray-100 rounded-lg p-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 rounded transition-all"
                    style={{
                      flex: month.income / Math.max(month.income, month.expense) || 0
                    }}
                    title={`Income: ${formatCurrency(month.income)}`}
                  />
                  <div
                    className="bg-red-500 rounded transition-all"
                    style={{
                      flex: month.expense / Math.max(month.income, month.expense) || 0
                    }}
                    title={`Expense: ${formatCurrency(month.expense)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights</h3>
            <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{aiInsights}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
