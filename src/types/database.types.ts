export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee' | 'cashier';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  hire_date: string;
  termination_date?: string;
  department: string;
  position: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'temporary';
  base_salary: number;
  hourly_rate: number;
  commission_rate: number;
  overtime_rate: number;
  work_hours_per_day?: number;
  work_shift?: 'day' | 'night' | 'flexible';
  bank_account?: string;
  tax_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  cost_price: number;
  selling_price: number;
  profit_margin: number;
  stock_quantity: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_of_measure: string;
  barcode?: string;
  image_url?: string;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  category_type: 'product' | 'expense';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  tax_id?: string;
  credit_limit: number;
  payment_terms: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  notes?: string;
  loyalty_points: number;
  total_purchases: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_id?: string;
  employee_id?: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  payment_status: 'paid' | 'partial' | 'unpaid' | 'cancelled';
  paid_amount: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  profit: number;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category_id?: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check';
  vendor?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  approved_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  overtime_pay: number;
  commission: number;
  bonuses: number;
  gross_pay: number;
  tax_deduction: number;
  insurance_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  payment_method: 'bank_transfer' | 'cash' | 'check';
  payment_status: 'pending' | 'processed' | 'paid' | 'failed';
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id: string;
  company_name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  show_about: boolean;
  show_team: boolean;
  show_products: boolean;
  show_gallery: boolean;
  show_contact: boolean;
  hero_title: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  about_title: string;
  about_content?: string;
  created_at: string;
  updated_at: string;
}
