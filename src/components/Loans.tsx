import { useState, useEffect } from 'react';
import { Plus, X, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Loan {
  id: string;
  name: string;
  principal_amount: number;
  remaining_amount: number;
  interest_rate: number | null;
  emi_amount: number | null;
  emi_day: number | null;
  start_date: string;
  end_date: string | null;
  lender: string | null;
  loan_type: string | null;
}

export function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadLoans();
  }, [user]);

  const loadLoans = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('end_date', { ascending: true, nullsFirst: true });

    if (error) {
      console.error('Error loading loans:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setLoans(data);
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

  const getMonthsRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const months = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
    return Math.max(0, months);
  };

  const totalDebt = loans.reduce((sum, loan) => sum + loan.remaining_amount, 0);
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
  const totalPaidOff = totalPrincipal - totalDebt;

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
          <h2 className="text-3xl font-bold text-gray-900">Loans & Debts</h2>
          <p className="text-gray-600 mt-1">Track and manage your loans and EMIs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Loan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Total Debt</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Principal Amount</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalPrincipal)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Amount Paid Off</div>
          <div className="text-3xl font-bold text-emerald-600">{formatCurrency(totalPaidOff)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Active Loans</div>
          <div className="text-3xl font-bold text-amber-600">{loans.length}</div>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 mb-4">
            <TrendingDown size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">No loans yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition"
          >
            Add Loan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const progress = (totalPaidOff / totalPrincipal) * 100;
            const monthsRemaining = getMonthsRemaining(loan.end_date);
            const loanProgress = ((loan.principal_amount - loan.remaining_amount) / loan.principal_amount) * 100;

            return (
              <div key={loan.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{loan.name}</h3>
                    {loan.lender && (
                      <p className="text-sm text-gray-500 mt-1">Lender: {loan.lender}</p>
                    )}
                  </div>
                  {loan.loan_type && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold capitalize">
                      {loan.loan_type}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Principal</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(loan.principal_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</div>
                    <div className="text-lg font-bold text-red-600">{formatCurrency(loan.remaining_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly EMI</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(loan.emi_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Interest Rate</div>
                    <div className="text-lg font-bold text-gray-900">{loan.interest_rate ? `${loan.interest_rate.toFixed(2)}%` : 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payoff Progress</span>
                    <span className="font-semibold text-emerald-600">{loanProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(loanProgress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    Start: {formatDate(loan.start_date)}
                  </div>
                  {monthsRemaining !== null && (
                    <div className={`font-semibold ${monthsRemaining === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {monthsRemaining === 0 ? 'Completed' : `${monthsRemaining} months left`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <AddLoanModal onClose={() => setShowAddModal(false)} onSuccess={loadLoans} />}
    </div>
  );
}

interface AddLoanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddLoanModal({ onClose, onSuccess }: AddLoanModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [remaining, setRemaining] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiDay, setEmiDay] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [lender, setLender] = useState('');
  const [loanType, setLoanType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('loans').insert({
        user_id: user.id,
        name,
        principal_amount: parseFloat(principal),
        remaining_amount: parseFloat(remaining),
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        emi_amount: emiAmount ? parseFloat(emiAmount) : null,
        emi_day: emiDay ? parseInt(emiDay) : null,
        start_date: startDate,
        end_date: endDate || null,
        lender: lender || null,
        loan_type: loanType || null,
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Failed to add loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Add Loan</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Loan Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Home Loan, Car Loan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  id="principal"
                  type="number"
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="remaining" className="block text-sm font-medium text-gray-700 mb-2">
                Remaining Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  id="remaining"
                  type="number"
                  step="0.01"
                  value={remaining}
                  onChange={(e) => setRemaining(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%)
              </label>
              <input
                id="interestRate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="emiAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly EMI
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  id="emiAmount"
                  type="number"
                  step="0.01"
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Expected)
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lender" className="block text-sm font-medium text-gray-700 mb-2">
                Lender
              </label>
              <input
                id="lender"
                type="text"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., HDFC Bank"
              />
            </div>

            <div>
              <label htmlFor="loanType" className="block text-sm font-medium text-gray-700 mb-2">
                Loan Type
              </label>
              <input
                id="loanType"
                type="text"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Home, Car, Personal"
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
              {loading ? 'Adding...' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
