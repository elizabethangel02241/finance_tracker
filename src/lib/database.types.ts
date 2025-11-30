export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string | null
          avatar_url: string | null
          timezone: string
          currency: string
          plan_type: string
          plan_expires_at: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          currency?: string
          plan_type?: string
          plan_expires_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          currency?: string
          plan_type?: string
          plan_expires_at?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          parent_id: string | null
          is_system: boolean
          keywords: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string | null
          is_system?: boolean
          keywords?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string | null
          is_system?: boolean
          keywords?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'upi' | 'investment' | 'loan' | 'other'
          provider: string | null
          account_number: string | null
          balance: number
          currency: string
          color: string
          icon: string
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'upi' | 'investment' | 'loan' | 'other'
          provider?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          color?: string
          icon?: string
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'cash' | 'bank' | 'credit_card' | 'upi' | 'investment' | 'loan' | 'other'
          provider?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          color?: string
          icon?: string
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          receipt_id: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer'
          merchant: string | null
          description: string | null
          transaction_date: string
          tags: string[]
          source: 'manual' | 'sms' | 'ocr' | 'import' | 'api'
          raw_data: Json
          is_recurring: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id?: string | null
          receipt_id?: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer'
          merchant?: string | null
          description?: string | null
          transaction_date?: string
          tags?: string[]
          source?: 'manual' | 'sms' | 'ocr' | 'import' | 'api'
          raw_data?: Json
          is_recurring?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string | null
          receipt_id?: string | null
          amount?: number
          type?: 'income' | 'expense' | 'transfer'
          merchant?: string | null
          description?: string | null
          transaction_date?: string
          tags?: string[]
          source?: 'manual' | 'sms' | 'ocr' | 'import' | 'api'
          raw_data?: Json
          is_recurring?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          account_id: string | null
          name: string
          amount: number
          period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          start_date: string
          end_date: string | null
          alert_at_percentage: number
          auto_adjust: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          account_id?: string | null
          name: string
          amount: number
          period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          start_date: string
          end_date?: string | null
          alert_at_percentage?: number
          auto_adjust?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          account_id?: string | null
          name?: string
          amount?: number
          period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          start_date?: string
          end_date?: string | null
          alert_at_percentage?: number
          auto_adjust?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          target_amount: number
          current_amount: number
          target_date: string | null
          icon: string
          color: string
          priority: number
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          target_amount: number
          current_amount?: number
          target_date?: string | null
          icon?: string
          color?: string
          priority?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          icon?: string
          color?: string
          priority?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          ocr_raw: Json
          parsed_amount: number | null
          parsed_merchant: string | null
          parsed_date: string | null
          parsed_items: Json
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          ocr_raw?: Json
          parsed_amount?: number | null
          parsed_merchant?: string | null
          parsed_date?: string | null
          parsed_items?: Json
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          ocr_raw?: Json
          parsed_amount?: number | null
          parsed_merchant?: string | null
          parsed_date?: string | null
          parsed_items?: Json
          processed?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          category_id: string | null
          name: string
          amount: number
          billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          next_billing_date: string
          merchant: string | null
          description: string | null
          is_active: boolean
          remind_days_before: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          category_id?: string | null
          name: string
          amount: number
          billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          next_billing_date: string
          merchant?: string | null
          description?: string | null
          is_active?: boolean
          remind_days_before?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          category_id?: string | null
          name?: string
          amount?: number
          billing_cycle?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          next_billing_date?: string
          merchant?: string | null
          description?: string | null
          is_active?: boolean
          remind_days_before?: number
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          name: string
          principal_amount: number
          remaining_amount: number
          interest_rate: number | null
          emi_amount: number | null
          emi_day: number | null
          start_date: string
          end_date: string | null
          lender: string | null
          loan_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          name: string
          principal_amount: number
          remaining_amount: number
          interest_rate?: number | null
          emi_amount?: number | null
          emi_day?: number | null
          start_date: string
          end_date?: string | null
          lender?: string | null
          loan_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          name?: string
          principal_amount?: number
          remaining_amount?: number
          interest_rate?: number | null
          emi_amount?: number | null
          emi_day?: number | null
          start_date?: string
          end_date?: string | null
          lender?: string | null
          loan_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          name: string
          type: 'stocks' | 'mutual_funds' | 'crypto' | 'gold' | 'real_estate' | 'other'
          quantity: number | null
          purchase_price: number | null
          current_price: number | null
          purchase_date: string | null
          symbol: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          name: string
          type: 'stocks' | 'mutual_funds' | 'crypto' | 'gold' | 'real_estate' | 'other'
          quantity?: number | null
          purchase_price?: number | null
          current_price?: number | null
          purchase_date?: string | null
          symbol?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          name?: string
          type?: 'stocks' | 'mutual_funds' | 'crypto' | 'gold' | 'real_estate' | 'other'
          quantity?: number | null
          purchase_price?: number | null
          current_price?: number | null
          purchase_date?: string | null
          symbol?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
