import { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Investment {
  id: string;
  name: string;
  type: string;
  quantity: number | null;
  purchase_price: number | null;
  current_price: number | null;
  purchase_date: string | null;
  symbol: string | null;
  notes: string | null;
}

export function Investments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadInvestments();
  }, [user]);

  const loadInvestments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error loading investments:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setInvestments(data);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateGainLoss = (investment: Investment) => {
    if (!investment.quantity || !investment.purchase_price || !investment.current_price) return null;
    const totalInvested = investment.quantity * investment.purchase_price;
    const currentValue = investment.quantity * investment.current_price;
    return currentValue - totalInvested;
  };

  const calculateGainLossPercentage = (investment: Investment) => {
    if (!investment.purchase_price || !investment.current_price) return null;
    return ((investment.current_price - investment.purchase_price) / investment.purchase_price) * 100;
  };

  const getTotalInvested = () => {
    return investments.reduce((sum, inv) => {
      if (inv.quantity && inv.purchase_price) {
        return sum + (inv.quantity * inv.purchase_price);
      }
      return sum;
    }, 0);
  };

  const getTotalCurrentValue = () => {
    return investments.reduce((sum, inv) => {
      if (inv.quantity && inv.current_price) {
        return sum + (inv.quantity * inv.current_price);
      }
      return sum;
    }, 0);
  };

  const getTotalGainLoss = () => {
    return getTotalCurrentValue() - getTotalInvested();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stocks':
        return '📈';
      case 'mutual_funds':
        return '💼';
      case 'crypto':
        return '₿';
      case 'gold':
        return '🪙';
      case 'real_estate':
        return '🏠';
      default:
        return '💰';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stocks':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'mutual_funds':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'crypto':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'gold':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'real_estate':
        return 'bg-green-50 text-green-600 border-green-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalInvested = getTotalInvested();
  const totalCurrentValue = getTotalCurrentValue();
  const totalGainLoss = getTotalGainLoss();
  const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Investments</h2>
          <p className="text-gray-600 mt-1">Track your investment portfolio</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Investment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Total Invested</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Current Value</div>
          <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalCurrentValue)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Gain / Loss</div>
          <div className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Return %</div>
          <div className={`text-3xl font-bold ${gainLossPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 mb-4">
            <Zap size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">No investments yet. Start building your portfolio!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
          >
            Add Investment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => {
            const gainLoss = calculateGainLoss(investment);
            const gainLossPercent = calculateGainLossPercentage(investment);
            const currentValue = investment.quantity && investment.current_price
              ? investment.quantity * investment.current_price
              : null;
            const investedValue = investment.quantity && investment.purchase_price
              ? investment.quantity * investment.purchase_price
              : null;

            return (
              <div key={investment.id} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition ${getTypeColor(investment.type)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-4xl">{getTypeIcon(investment.type)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                      {investment.symbol && (
                        <p className="text-sm text-gray-500 mt-1">Symbol: {investment.symbol}</p>
                      )}
                      {investment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{investment.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getTypeColor(investment.type)}`}>
                    {investment.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
                    <div className="text-lg font-bold text-gray-900">{investment.quantity?.toFixed(4) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Purchase Price</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(investment.purchase_price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Price</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(investment.current_price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invested</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(investedValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Value</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(currentValue)}</div>
                  </div>
                </div>

                {gainLoss !== null && gainLossPercent !== null && (
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Gain / Loss</div>
                      <div className={`text-lg font-bold ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${gainLossPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                    </div>
                  </div>
                )}

                {investment.purchase_date && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                    Purchased: {formatDate(investment.purchase_date)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <AddInvestmentModal onClose={() => setShowAddModal(false)} onSuccess={loadInvestments} />}
    </div>
  );
}

interface AddInvestmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddInvestmentModal({ onClose, onSuccess }: AddInvestmentModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<'stocks' | 'mutual_funds' | 'crypto' | 'gold' | 'real_estate' | 'other'>('stocks');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [symbol, setSymbol] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const investmentTypes = [
    { value: 'stocks', label: 'Stocks', icon: '📈' },
    { value: 'mutual_funds', label: 'Mutual Funds', icon: '💼' },
    { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
    { value: 'gold', label: 'Gold', icon: '🪙' },
    { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { value: 'other', label: 'Other', icon: '💰' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('investments').insert({
        user_id: user.id,
        name,
        type,
        quantity: quantity ? parseFloat(quantity) : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        current_price: currentPrice ? parseFloat(currentPrice) : null,
        purchase_date: purchaseDate || null,
        symbol: symbol || null,
        notes: notes || null,
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('Failed to add investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Add Investment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Investment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {investmentTypes.map((invType) => (
                <button
                  key={invType.value}
                  type="button"
                  onClick={() => setType(invType.value as any)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    type === invType.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{invType.icon}</div>
                  <div className="text-xs font-medium">{invType.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Apple Stock, Bitcoin"
              required
            />
          </div>

          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
              Symbol (Optional)
            </label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., AAPL, BTC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                step="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Current Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Add any notes about this investment..."
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
              {loading ? 'Adding...' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
