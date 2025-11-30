import { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, Repeat, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  next_billing_date: string;
  merchant: string | null;
  description: string | null;
  is_active: boolean;
  category_name: string | null;
}

export function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        name,
        amount,
        billing_cycle,
        next_billing_date,
        merchant,
        description,
        is_active,
        categories(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true });

    if (error) {
      console.error('Error loading subscriptions:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const formatted = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        billing_cycle: s.billing_cycle,
        next_billing_date: s.next_billing_date,
        merchant: s.merchant,
        description: s.description,
        is_active: s.is_active,
        category_name: s.categories?.name || null,
      }));
      setSubscriptions(formatted);
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

  const getDaysUntilBilling = (dateString: string) => {
    const billingDate = new Date(dateString);
    const today = new Date();
    const diff = billingDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const monthlySpend = subscriptions.reduce((sum, s) => {
    const multiplier = {
      'daily': 30,
      'weekly': 4.3,
      'monthly': 1,
      'quarterly': 0.33,
      'yearly': 0.083
    }[s.billing_cycle] || 1;
    return sum + (s.amount * multiplier);
  }, 0);

  const yearlySpend = subscriptions.reduce((sum, s) => {
    const multiplier = {
      'daily': 365,
      'weekly': 52,
      'monthly': 12,
      'quarterly': 4,
      'yearly': 1
    }[s.billing_cycle] || 1;
    return sum + (s.amount * multiplier);
  }, 0);

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
          <h2 className="text-3xl font-bold text-gray-900">Subscriptions</h2>
          <p className="text-gray-600 mt-1">Track and manage your recurring payments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Subscription</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Active Subscriptions</div>
          <div className="text-4xl font-bold text-emerald-600">{subscriptions.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Monthly Spend</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(monthlySpend)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Yearly Spend</div>
          <div className="text-3xl font-bold text-amber-600">{formatCurrency(yearlySpend)}</div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 mb-4">
            <Repeat size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">No subscriptions yet. Add your first subscription!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
          >
            Add Subscription
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const daysUntil = getDaysUntilBilling(sub.next_billing_date);
            const isUpcoming = daysUntil <= 7;

            return (
              <div key={sub.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                    {sub.merchant && (
                      <p className="text-sm text-gray-500 mt-1">{sub.merchant}</p>
                    )}
                    {sub.description && (
                      <p className="text-sm text-gray-600 mt-1">{sub.description}</p>
                    )}
                  </div>
                  {isUpcoming && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-600">Due Soon</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(sub.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frequency</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{sub.billing_cycle}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Billing</div>
                    <div className="text-lg font-bold text-gray-900">{formatDate(sub.next_billing_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Days Left</div>
                    <div className={`text-lg font-bold ${daysUntil <= 3 ? 'text-red-600' : daysUntil <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {daysUntil > 0 ? daysUntil : 'Today'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <AddSubscriptionModal onClose={() => setShowAddModal(false)} onSuccess={loadSubscriptions} />}
    </div>
  );
}

interface AddSubscriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddSubscriptionModal({ onClose, onSuccess }: AddSubscriptionModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [merchant, setMerchant] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        name,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        merchant: merchant || null,
        next_billing_date: nextBillingDate,
        is_active: true,
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Failed to add subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Subscription</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Netflix, Spotify"
              required
            />
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
            <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 mb-2">
              Billing Cycle
            </label>
            <select
              id="billingCycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant (Optional)
            </label>
            <input
              id="merchant"
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Netflix Inc."
            />
          </div>

          <div>
            <label htmlFor="nextBillingDate" className="block text-sm font-medium text-gray-700 mb-2">
              Next Billing Date
            </label>
            <input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
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
              {loading ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
