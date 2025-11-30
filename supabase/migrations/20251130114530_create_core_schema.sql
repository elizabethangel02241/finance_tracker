/*
  # Finance Budget Tracker - Core Schema

  ## Overview
  Complete database schema for AI-powered personal finance management system.
  Supports multi-account tracking, budgets, goals, investments, and AI-powered insights.

  ## Tables Created

  ### 1. profiles
  - Extended user profile data linked to auth.users
  - Stores timezone, currency preferences, plan information
  - Metadata for customization and settings

  ### 2. accounts (Wallets)
  - Bank accounts, cash, UPI, credit cards, investments
  - Real-time balance tracking
  - Provider integration metadata

  ### 3. categories
  - Hierarchical expense/income categories
  - System-wide and user-custom categories
  - ML training keywords for auto-categorization

  ### 4. transactions
  - Core transaction records with multi-source support
  - Links to accounts, categories, receipts
  - Tags and metadata for rich filtering

  ### 5. budgets
  - Flexible budget rules (monthly, weekly, custom periods)
  - Category-specific or account-specific
  - Auto-adjustment capabilities

  ### 6. goals
  - Savings goals with progress tracking
  - Auto-deduction rules
  - Target dates and milestones

  ### 7. receipts
  - OCR-scanned receipt storage
  - Parsed data with original image reference
  - Transaction linking

  ### 8. subscriptions
  - Recurring payment tracking
  - Renewal reminders
  - Cost analysis

  ### 9. loans
  - Debt tracking with EMI schedules
  - Interest calculation support
  - Payoff projections

  ### 10. investments
  - Portfolio tracking (stocks, MF, crypto, etc.)
  - Performance metrics
  - Cost basis tracking

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Admin access separated from user access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  avatar_url text,
  timezone text DEFAULT 'Asia/Kolkata',
  currency text DEFAULT 'INR',
  plan_type text DEFAULT 'free',
  plan_expires_at timestamptz,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT '📁',
  color text DEFAULT '#6366f1',
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_system boolean DEFAULT false,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Accounts (Wallets) table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'upi', 'investment', 'loan', 'other')),
  provider text,
  account_number text,
  balance numeric(15, 2) DEFAULT 0,
  currency text DEFAULT 'INR',
  color text DEFAULT '#10b981',
  icon text DEFAULT '💳',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own accounts"
  ON accounts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  ocr_raw jsonb DEFAULT '{}',
  parsed_amount numeric(15, 2),
  parsed_merchant text,
  parsed_date date,
  parsed_items jsonb DEFAULT '[]',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own receipts"
  ON receipts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  amount numeric(15, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  merchant text,
  description text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  tags text[] DEFAULT '{}',
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'sms', 'ocr', 'import', 'api')),
  raw_data jsonb DEFAULT '{}',
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(15, 2) NOT NULL,
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  start_date date NOT NULL,
  end_date date,
  alert_at_percentage integer DEFAULT 80,
  auto_adjust boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  target_amount numeric(15, 2) NOT NULL,
  current_amount numeric(15, 2) DEFAULT 0,
  target_date date,
  icon text DEFAULT '🎯',
  color text DEFAULT '#f59e0b',
  priority integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric(15, 2) NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_billing_date date NOT NULL,
  merchant text,
  description text,
  is_active boolean DEFAULT true,
  remind_days_before integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  principal_amount numeric(15, 2) NOT NULL,
  remaining_amount numeric(15, 2) NOT NULL,
  interest_rate numeric(5, 2),
  emi_amount numeric(15, 2),
  emi_day integer,
  start_date date NOT NULL,
  end_date date,
  lender text,
  loan_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own loans"
  ON loans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('stocks', 'mutual_funds', 'crypto', 'gold', 'real_estate', 'other')),
  quantity numeric(15, 6),
  purchase_price numeric(15, 2),
  current_price numeric(15, 2),
  purchase_date date,
  symbol text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own investments"
  ON investments FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Insert default system categories
INSERT INTO categories (name, type, icon, color, is_system, keywords) VALUES
('Salary', 'income', '💰', '#10b981', true, ARRAY['salary', 'wage', 'payroll']),
('Freelance', 'income', '💼', '#059669', true, ARRAY['freelance', 'contract', 'consulting']),
('Business', 'income', '🏢', '#047857', true, ARRAY['business', 'revenue', 'sales']),
('Investment', 'income', '📈', '#065f46', true, ARRAY['dividend', 'interest', 'capital gain']),
('Other Income', 'income', '💵', '#6ee7b7', true, ARRAY['gift', 'bonus', 'refund']),
('Food & Dining', 'expense', '🍔', '#ef4444', true, ARRAY['food', 'restaurant', 'dining', 'zomato', 'swiggy']),
('Groceries', 'expense', '🛒', '#dc2626', true, ARRAY['grocery', 'supermarket', 'vegetables', 'bigbasket']),
('Transportation', 'expense', '🚗', '#f97316', true, ARRAY['fuel', 'petrol', 'uber', 'ola', 'metro', 'bus']),
('Shopping', 'expense', '🛍️', '#ec4899', true, ARRAY['shopping', 'clothes', 'amazon', 'flipkart']),
('Entertainment', 'expense', '🎬', '#8b5cf6', true, ARRAY['movie', 'netflix', 'prime', 'spotify']),
('Bills & Utilities', 'expense', '📱', '#3b82f6', true, ARRAY['electricity', 'water', 'gas', 'internet', 'mobile']),
('Healthcare', 'expense', '🏥', '#06b6d4', true, ARRAY['doctor', 'medicine', 'hospital', 'pharmacy']),
('Education', 'expense', '📚', '#0ea5e9', true, ARRAY['school', 'course', 'books', 'tuition']),
('Rent', 'expense', '🏠', '#6366f1', true, ARRAY['rent', 'lease', 'housing']),
('Insurance', 'expense', '🛡️', '#4f46e5', true, ARRAY['insurance', 'premium', 'policy']),
('Travel', 'expense', '✈️', '#0891b2', true, ARRAY['travel', 'hotel', 'flight', 'vacation']),
('Personal Care', 'expense', '💆', '#d946ef', true, ARRAY['salon', 'spa', 'gym', 'fitness']),
('Other', 'expense', '📦', '#64748b', true, ARRAY['misc', 'other'])
ON CONFLICT DO NOTHING;