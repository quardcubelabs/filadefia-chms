'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useTheme } from '@/contexts/ThemeContext';
import MainLayout from '@/components/MainLayout';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  Badge, 
  Modal, 
  ConfirmModal, 
  EmptyState, 
  Loading, 
  Alert,
  TextArea
} from '@/components/ui';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  PieChart,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  History,
  ArrowLeft
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface FinancialTransaction {
  id: string;
  member_id?: string;
  transaction_type: 'tithe' | 'offering' | 'donation' | 'project' | 'pledge' | 'mission' | 'welfare' | 'expense';
  amount: number;
  currency: string;
  description?: string;
  payment_method: string;
  reference_number?: string;
  department_id?: string;
  zone_id?: string;
  date: string;
  recorded_by: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  receipt_url?: string;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    member_number: string;
  };
  department?: {
    name: string;
  };
  zone?: {
    name: string;
  };
  recorder?: {
    first_name: string;
    last_name: string;
  };
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

interface Zone {
  id: string;
  name: string;
  is_active: boolean;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: number;
  unverifiedCount: number;
}

export default function FinancePage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName, loading: departmentLoading } = useDepartmentAccess();
  const { darkMode } = useTheme();
  
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    recentTransactions: 0,
    unverifiedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if initial data has been loaded
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Chart period filters
  const [trendChartPeriod, setTrendChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [incomeChartPeriod, setIncomeChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // View mode for transactions
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const RECENT_TRANSACTIONS_LIMIT = 10;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    member_id: '',
    transaction_type: 'offering' as FinancialTransaction['transaction_type'],
    amount: '',
    description: '',
    payment_method: 'Cash',
    reference_number: '',
    department_id: '',
    zone_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  const paymentMethods = [
    'Cash', 'M-Pesa', 'TigoPesa', 'Airtel Money', 'Bank Transfer', 
    'Check', 'Card', 'Online', 'Other'
  ];

  useEffect(() => {
    if (!authLoading && !departmentLoading && !user) {
      window.location.href = '/login';
      return;
    }
    
    // Only load data once when both auth and department access are resolved
    // And only if we haven't already loaded the data
    // Also wait for profile to be loaded (user.profile not null)
    if (user && user.profile && !authLoading && !departmentLoading && !dataLoaded) {
      setDataLoaded(true); // Mark as loaded to prevent re-runs
      loadTransactions();
      loadDepartments();
      loadZones();
      loadMembers();
    }
  }, [user, authLoading, departmentLoading, dataLoaded]); // Added dataLoaded to dependencies

  const loadTransactions = async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Build query - filter by department if user is a department leader
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          member:members(first_name, last_name, member_number),
          department:departments(name),
          zone:zones(name)
        `);

      // If user is a department leader, filter by their department
      if (isDepartmentLeader && departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setTransactions(data || []);
      calculateSummary(data || []);
      
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Failed to load financial transactions');
      setTransactions([]);
      calculateSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const seedSampleData = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      setSeeding(true);
      setError(null);
      
      // Insert sample transactions for testing
      const sampleTransactions = [
        {
          member_id: null,
          transaction_type: 'offering',
          amount: 25000.00,
          currency: 'TZS',
          description: 'Sunday Service Offering',
          payment_method: 'Cash',
          reference_number: null,
          department_id: null,
          date: new Date().toISOString().split('T')[0],
          recorded_by: user.profile.id,
          verified: true,
          verified_by: user.profile.id,
          verified_at: new Date().toISOString()
        },
        {
          member_id: null,
          transaction_type: 'tithe',
          amount: 50000.00,
          currency: 'TZS',
          description: 'Monthly Tithe',
          payment_method: 'M-Pesa',
          reference_number: 'MP' + Date.now(),
          department_id: null,
          date: new Date().toISOString().split('T')[0],
          recorded_by: user.profile.id,
          verified: true,
          verified_by: user.profile.id,
          verified_at: new Date().toISOString()
        },
        {
          member_id: null,
          transaction_type: 'donation',
          amount: 100000.00,
          currency: 'TZS',
          description: 'Building Fund Donation',
          payment_method: 'Bank Transfer',
          reference_number: 'BT' + Date.now(),
          department_id: null,
          date: new Date().toISOString().split('T')[0],
          recorded_by: user.profile.id,
          verified: false,
          verified_by: null,
          verified_at: null
        },
        {
          member_id: null,
          transaction_type: 'expense',
          amount: 30000.00,
          currency: 'TZS',
          description: 'Electricity Bill',
          payment_method: 'Cash',
          reference_number: null,
          department_id: null,
          date: new Date().toISOString().split('T')[0],
          recorded_by: user.profile.id,
          verified: true,
          verified_by: user.profile.id,
          verified_at: new Date().toISOString()
        }
      ];
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert(sampleTransactions);
      
      if (error) {
        console.error('Seeding error:', error);
        throw error;
      }
      
      setSuccess('Sample financial data added successfully!');
      loadTransactions();
    } catch (err: any) {
      console.error('Seeding error:', err);
      setError(`Failed to seed data: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const loadDepartments = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error loading departments:', err);
    }
  };

  const loadZones = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setZones(data || []);
    } catch (err: any) {
      console.error('Error loading zones:', err);
    }
  };

  const loadMembers = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, member_number')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
    }
  };

  const calculateSummary = (transactionData: FinancialTransaction[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
    const expenseTypes = ['expense', 'welfare'];
    
    const totalIncome = transactionData
      .filter(t => incomeTypes.includes(t.transaction_type))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactionData
      .filter(t => expenseTypes.includes(t.transaction_type))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const monthlyIncome = transactionData
      .filter(t => {
        const transactionDate = new Date(t.date);
        return incomeTypes.includes(t.transaction_type) &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const monthlyExpenses = transactionData
      .filter(t => {
        const transactionDate = new Date(t.date);
        return expenseTypes.includes(t.transaction_type) &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const recentTransactions = transactionData.filter(t => {
      const transactionDate = new Date(t.date);
      const daysDiff = (new Date().getTime() - transactionDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    }).length;
    
    const unverifiedCount = transactionData.filter(t => !t.verified).length;

    setSummary({
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      recentTransactions,
      unverifiedCount
    });
  };

  const handleAddTransaction = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const transactionData = {
        member_id: formData.member_id || null,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        department_id: isDepartmentLeader ? departmentId : (formData.department_id || null),
        zone_id: formData.zone_id || null,
        date: formData.date,
        recorded_by: user.profile.id
      };

      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionData);

      if (error) throw error;

      setSuccess('Transaction added successfully!');
      setIsAddModalOpen(false);
      resetForm();
      loadTransactions();
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setError(err.message);
    }
  };

  const handleEditTransaction = async () => {
    if (!supabase || !selectedTransaction) return;

    try {
      const transactionData = {
        member_id: formData.member_id || null,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        department_id: isDepartmentLeader ? departmentId : (formData.department_id || null),
        zone_id: formData.zone_id || null,
        date: formData.date
      };

      const { error } = await supabase
        .from('financial_transactions')
        .update(transactionData)
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      setSuccess('Transaction updated successfully!');
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
      resetForm();
      loadTransactions();
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err.message);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!supabase || !selectedTransaction) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      setSuccess('Transaction deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
      loadTransactions();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      setError(err.message);
    }
  };

  const handleVerifyTransaction = async (transactionId: string) => {
    if (!supabase || !user?.profile?.id) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          verified: true,
          verified_by: user.profile.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      setSuccess('Transaction verified successfully!');
      loadTransactions();
    } catch (err: any) {
      console.error('Error verifying transaction:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      transaction_type: 'offering',
      amount: '',
      description: '',
      payment_method: 'Cash',
      reference_number: '',
      department_id: '',
      zone_id: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditModal = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      member_id: transaction.member_id || '',
      transaction_type: transaction.transaction_type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      payment_method: transaction.payment_method,
      reference_number: transaction.reference_number || '',
      department_id: transaction.department_id || '',
      zone_id: transaction.zone_id || '',
      date: transaction.date
    });
    setIsEditModalOpen(true);
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      tithe: 'bg-green-100 text-green-800',
      offering: 'bg-blue-100 text-blue-800',
      donation: 'bg-purple-100 text-purple-800',
      project: 'bg-indigo-100 text-indigo-800',
      pledge: 'bg-cyan-100 text-cyan-800',
      mission: 'bg-pink-100 text-pink-800',
      welfare: 'bg-orange-100 text-orange-800',
      expense: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionTypeIcon = (type: string) => {
    const isExpense = ['expense', 'welfare'].includes(type);
    return isExpense ? 
      <TrendingDown className="h-4 w-4 text-red-600" /> : 
      <TrendingUp className="h-4 w-4 text-green-600" />;
  };

  const formatCurrency = (amount: number) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.member?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.member?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false;
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    // Department leaders already have filtered transactions from loadTransactions
    const matchesDepartment = isDepartmentLeader ? true : (filterDepartment === 'all' || transaction.department_id === filterDepartment);
    const matchesPaymentMethod = filterPaymentMethod === 'all' || transaction.payment_method === filterPaymentMethod;
    const matchesVerified = filterVerified === 'all' || 
                           (filterVerified === 'verified' && transaction.verified) ||
                           (filterVerified === 'unverified' && !transaction.verified);
    
    const transactionDate = new Date(transaction.date);
    const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || transactionDate <= new Date(dateTo);
    
    return matchesSearch && matchesType && matchesDepartment && matchesPaymentMethod && 
           matchesVerified && matchesDateFrom && matchesDateTo;
  });

  if (authLoading || departmentLoading || loading) {
    return (
      <MainLayout title="Finance Management">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  const title = 'Finance Management';
    
  const subtitle = isDepartmentLeader 
    ? `Manage transactions for ${departmentName} department` 
    : 'Track church income, expenses, and financial health';

  return (
    <MainLayout 
      title={title}
      subtitle={subtitle}
    >
      <div className="max-w-7xl mx-auto">
        {/* Debug Info */}
        {error && (
          <Alert variant="error" className="mb-4">
            <div className="flex flex-col space-y-3">
              <p>{error}</p>
              {transactions.length === 0 && (
                <div className="text-sm">
                  <p className="font-medium">To populate financial data:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-600">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to SQL Editor</li>
                    <li>Copy and paste the contents of <code className="bg-gray-100 px-1 rounded">database/seed_finances.sql</code></li>
                    <li>Click "Run" to execute</li>
                  </ol>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">💡 Sample Data Available</p>
                    <p className="text-blue-700 text-xs mt-1">
                      The seed file contains 80+ realistic transactions including tithes, offerings, donations, 
                      projects, and expenses with various payment methods (Cash, M-Pesa, Bank Transfer, etc.)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Alert>
        )}



            {/* Alerts */}
            {error && (
              <Alert 
                variant="error" 
                onClose={() => setError(null)}
                className="mb-6"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert 
                variant="success" 
                onClose={() => setSuccess(null)}
                className="mb-6"
              >
                {success}
              </Alert>
            )}



            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {/* Total Income Card */}
              <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0 ${darkMode ? 'bg-gradient-to-br from-green-900/50 to-green-800/30' : 'bg-gradient-to-br from-green-100 to-green-50'}`}>
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 sm:mb-3 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Income</p>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(summary.totalIncome)}
                </h3>
                <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This month: {formatCurrency(summary.monthlyIncome)}
                </p>
              </div>

              {/* Total Expenses Card */}
              <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0 ${darkMode ? 'bg-gradient-to-br from-red-900/50 to-red-800/30' : 'bg-gradient-to-br from-red-100 to-red-50'}`}>
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 sm:mb-3 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Expenses</p>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(summary.totalExpenses)}
                </h3>
                <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This month: {formatCurrency(summary.monthlyExpenses)}
                </p>
              </div>

              {/* Net Amount Card */}
              <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0 ${summary.netAmount >= 0 
                ? (darkMode ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30' : 'bg-gradient-to-br from-blue-100 to-blue-50') 
                : (darkMode ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/30' : 'bg-gradient-to-br from-orange-100 to-orange-50')}`}>
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 sm:mb-3 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
                  <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${summary.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Amount</p>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(summary.netAmount)}
                </h3>
                <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Monthly: {formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}
                </p>
              </div>

              {/* Recent Activity Card */}
              <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0 ${darkMode ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30' : 'bg-gradient-to-br from-purple-100 to-purple-50'}`}>
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 sm:mb-3 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recent Activity</p>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {summary.recentTransactions}
                </h3>
                <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {summary.unverifiedCount} unverified
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 justify-center sm:justify-end">
              {isDepartmentLeader ? (
                <>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-pink-200 hover:bg-pink-300 text-pink-800 border-pink-200 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                    Add Income
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddModalOpen(true);
                      setFormData(prev => ({ ...prev, transaction_type: 'expense' as const }));
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                    Add Expense
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-pink-200 hover:bg-pink-300 text-pink-800 border-pink-200 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                    Add Transaction
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddModalOpen(true);
                      setFormData(prev => ({ ...prev, transaction_type: 'expense' as const }));
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                    Add Expense
                  </Button>
                </>
              )}
            </div>

            {/* Search and Filters */}
            <Card className="mb-4 sm:mb-6" padding="sm" rounded="xl">
              <CardBody>
                {/* Search and Primary Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  <div className="md:col-span-1">
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    placeholder="Transaction Type"
                    className="w-full"
                    options={[
                      { value: "all", label: "All Types" },
                      { value: "tithe", label: "Tithe" },
                      { value: "offering", label: "Offering" },
                      { value: "donation", label: "Donation" },
                      { value: "project", label: "Project" },
                      { value: "pledge", label: "Pledge" },
                      { value: "mission", label: "Mission" },
                      { value: "welfare", label: "Welfare" },
                      { value: "expense", label: "Expense" }
                    ]}
                  />
                  {!isDepartmentLeader && (
                    <Select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      placeholder="Department"
                      className="w-full"
                      options={[
                        { value: "all", label: "All Departments" },
                        ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                      ]}
                    />
                  )}
                </div>
                
                {/* Secondary Filters */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                  <Select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    placeholder="Payment Method"
                    className="w-full"
                    options={[
                      { value: "all", label: "All Methods" },
                      ...paymentMethods.map(method => ({ value: method, label: method }))
                    ]}
                  />
                  <Select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value)}
                    placeholder="Verification"
                    className="w-full"
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "verified", label: "Verified" },
                      { value: "unverified", label: "Unverified" }
                    ]}
                  />
                  <Input
                    label="From Date"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardBody>
            </Card>

            {/* Financial Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Income vs Expense Line Chart */}
              <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-6 ${darkMode ? 'bg-slate-800' : 'bg-[#F1F5F9]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <h3 className={`text-base sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Financial Trend</h3>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-[#22D3EE]"></div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Income</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-[#2563EB]"></div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expense</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative self-end sm:self-auto">
                    <select 
                      value={trendChartPeriod}
                      onChange={(e) => setTrendChartPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                      className={`appearance-none border rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-gray-300' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        const incomeTypes = ['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
                        const expenseTypes = ['expense', 'welfare'];
                        
                        if (trendChartPeriod === 'weekly') {
                          // Weekly: Show data for each day of the current week
                          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          const weekData = days.map((day, index) => {
                            const today = new Date();
                            const dayOfWeek = today.getDay();
                            const diff = index - dayOfWeek;
                            const targetDate = new Date(today);
                            targetDate.setDate(today.getDate() + diff);
                            const dateStr = targetDate.toISOString().split('T')[0];
                            
                            const dayIncome = transactions
                              .filter(t => t.date === dateStr && incomeTypes.includes(t.transaction_type))
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            const dayExpense = transactions
                              .filter(t => t.date === dateStr && expenseTypes.includes(t.transaction_type))
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            return {
                              name: day,
                              income: dayIncome / 1000,
                              expense: dayExpense / 1000
                            };
                          });
                          
                          const hasData = weekData.some(d => d.income > 0 || d.expense > 0);
                          if (!hasData) {
                            return [
                              { name: 'Sun', income: 450, expense: 320 },
                              { name: 'Mon', income: 280, expense: 180 },
                              { name: 'Tue', income: 520, expense: 420 },
                              { name: 'Wed', income: 380, expense: 280 },
                              { name: 'Thu', income: 650, expense: 350 },
                              { name: 'Fri', income: 420, expense: 520 },
                              { name: 'Sat', income: 580, expense: 380 }
                            ];
                          }
                          return weekData;
                        } else if (trendChartPeriod === 'monthly') {
                          // Monthly: Show data for each week of the current month
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const weeksInMonth = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                          
                          const monthData = weeksInMonth.map((week, weekIndex) => {
                            const weekStart = new Date(currentYear, currentMonth, 1 + (weekIndex * 7));
                            const weekEnd = new Date(currentYear, currentMonth, Math.min(7 + (weekIndex * 7), new Date(currentYear, currentMonth + 1, 0).getDate()));
                            
                            const weekIncome = transactions
                              .filter(t => {
                                const tDate = new Date(t.date);
                                return tDate >= weekStart && tDate <= weekEnd && incomeTypes.includes(t.transaction_type);
                              })
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            const weekExpense = transactions
                              .filter(t => {
                                const tDate = new Date(t.date);
                                return tDate >= weekStart && tDate <= weekEnd && expenseTypes.includes(t.transaction_type);
                              })
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            return {
                              name: week,
                              income: weekIncome / 1000,
                              expense: weekExpense / 1000
                            };
                          });
                          
                          const hasData = monthData.some(d => d.income > 0 || d.expense > 0);
                          if (!hasData) {
                            return [
                              { name: 'Week 1', income: 1200, expense: 800 },
                              { name: 'Week 2', income: 1500, expense: 1100 },
                              { name: 'Week 3', income: 1800, expense: 1200 },
                              { name: 'Week 4', income: 1400, expense: 900 }
                            ];
                          }
                          return monthData;
                        } else {
                          // Yearly: Show data for each month of the current year
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const currentYear = new Date().getFullYear();
                          
                          const yearData = months.map((month, monthIndex) => {
                            const monthIncome = transactions
                              .filter(t => {
                                const tDate = new Date(t.date);
                                return tDate.getFullYear() === currentYear && tDate.getMonth() === monthIndex && incomeTypes.includes(t.transaction_type);
                              })
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            const monthExpense = transactions
                              .filter(t => {
                                const tDate = new Date(t.date);
                                return tDate.getFullYear() === currentYear && tDate.getMonth() === monthIndex && expenseTypes.includes(t.transaction_type);
                              })
                              .reduce((sum, t) => sum + Number(t.amount), 0);
                            
                            return {
                              name: month,
                              income: monthIncome / 1000000, // Convert to millions for yearly
                              expense: monthExpense / 1000000
                            };
                          });
                          
                          const hasData = yearData.some(d => d.income > 0 || d.expense > 0);
                          if (!hasData) {
                            return [
                              { name: 'Jan', income: 4.5, expense: 3.2 },
                              { name: 'Feb', income: 5.2, expense: 3.8 },
                              { name: 'Mar', income: 4.8, expense: 3.5 },
                              { name: 'Apr', income: 6.1, expense: 4.2 },
                              { name: 'May', income: 5.5, expense: 3.9 },
                              { name: 'Jun', income: 6.8, expense: 4.5 },
                              { name: 'Jul', income: 5.9, expense: 4.1 },
                              { name: 'Aug', income: 6.2, expense: 4.3 },
                              { name: 'Sep', income: 5.7, expense: 3.8 },
                              { name: 'Oct', income: 6.5, expense: 4.6 },
                              { name: 'Nov', income: 7.2, expense: 5.1 },
                              { name: 'Dec', income: 8.5, expense: 6.2 }
                            ];
                          }
                          return yearData;
                        }
                      })()}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
                        itemStyle={{ color: '#fff', fontSize: 14 }}
                        formatter={(value: number, name: string) => [
                          trendChartPeriod === 'yearly' 
                            ? `TZS ${(value * 1000000).toLocaleString()}`
                            : `TZS ${(value * 1000).toLocaleString()}`,
                          name === 'income' ? 'Income' : 'Expense'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#22D3EE"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#22D3EE', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income Breakdown Donut Chart */}
              <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-6 ${darkMode ? 'bg-slate-800' : 'bg-[#F1F5F9]'}`}>
                <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                  <h3 className={`text-base sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Income (%)</h3>
                  <div className="relative">
                    <select 
                      value={incomeChartPeriod}
                      onChange={(e) => setIncomeChartPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                      className={`appearance-none border rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-gray-300' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>

                {/* Total Income - Top */}
                <div className="mb-3 sm:mb-4">
                  <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Income ({incomeChartPeriod === 'weekly' ? 'This Week' : incomeChartPeriod === 'monthly' ? 'This Month' : 'This Year'})</p>
                  <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {(() => {
                      const now = new Date();
                      let startDate: Date;
                      
                      if (incomeChartPeriod === 'weekly') {
                        const dayOfWeek = now.getDay();
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - dayOfWeek);
                        startDate.setHours(0, 0, 0, 0);
                      } else if (incomeChartPeriod === 'monthly') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                      } else {
                        startDate = new Date(now.getFullYear(), 0, 1);
                      }
                      
                      const periodTransactions = transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startDate && tDate <= now && t.transaction_type !== 'expense';
                      });
                      
                      const periodTotal = periodTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
                      return `TZS ${periodTotal.toLocaleString()}`;
                    })()}
                  </p>
                </div>

                {/* Chart and Legend Row */}
                <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                  {/* Donut Chart */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    {(() => {
                      // Filter transactions by period
                      const now = new Date();
                      let startDate: Date;
                      
                      if (incomeChartPeriod === 'weekly') {
                        const dayOfWeek = now.getDay();
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - dayOfWeek);
                        startDate.setHours(0, 0, 0, 0);
                      } else if (incomeChartPeriod === 'monthly') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                      } else {
                        startDate = new Date(now.getFullYear(), 0, 1);
                      }
                      
                      const periodTransactions = transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startDate && tDate <= now;
                      });
                      
                      const offerings = periodTransactions
                        .filter(t => t.transaction_type === 'offering')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                      const tithes = periodTransactions
                        .filter(t => t.transaction_type === 'tithe')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                      const contributions = periodTransactions
                        .filter(t => ['donation', 'project', 'pledge', 'mission'].includes(t.transaction_type))
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                      
                      const total = offerings + tithes + contributions;
                      
                      // Use sample data if no transactions
                      const offeringsRatio = total === 0 ? 0.35 : offerings / total;
                      const tithesRatio = total === 0 ? 0.45 : tithes / total;
                      const contributionsRatio = total === 0 ? 0.20 : contributions / total;

                      return (
                        <svg className="transform -rotate-90 w-[120px] h-[120px] sm:w-[180px] sm:h-[180px]" viewBox="0 0 200 200">
                          <defs>
                            <linearGradient id="incomeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                            </linearGradient>
                            <linearGradient id="incomeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                            </linearGradient>
                            <linearGradient id="incomeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#db2777', stopOpacity: 1 }} />
                            </linearGradient>
                          </defs>
                          
                          {/* Background circle */}
                          <circle
                            cx="100"
                            cy="100"
                            r="75"
                            fill="none"
                            stroke="#f5f5f5"
                            strokeWidth="28"
                          />
                          
                          {/* Offerings segment (Cyan) */}
                          {offeringsRatio > 0 && (
                            <circle
                              cx="100"
                              cy="100"
                              r="80"
                              fill="none"
                              stroke="url(#incomeGradient1)"
                              strokeWidth="32"
                              strokeDasharray={`${2 * Math.PI * 80 * offeringsRatio} ${2 * Math.PI * 80 * (1 - offeringsRatio)}`}
                              strokeLinecap="butt"
                            />
                          )}
                          
                          {/* Tithes segment (Blue) */}
                          {tithesRatio > 0 && (
                            <circle
                              cx="100"
                              cy="100"
                              r="72"
                              fill="none"
                              stroke="url(#incomeGradient2)"
                              strokeWidth="20"
                              strokeDasharray={`${2 * Math.PI * 72 * tithesRatio} ${2 * Math.PI * 72 * (1 - tithesRatio)}`}
                              strokeDashoffset={`${-2 * Math.PI * 72 * offeringsRatio}`}
                              strokeLinecap="butt"
                            />
                          )}
                          
                          {/* Contributions segment (Pink) */}
                          {contributionsRatio > 0 && (
                            <circle
                              cx="100"
                              cy="100"
                              r="76"
                              fill="none"
                              stroke="url(#incomeGradient3)"
                              strokeWidth="28"
                              strokeDasharray={`${2 * Math.PI * 76 * contributionsRatio} ${2 * Math.PI * 76 * (1 - contributionsRatio)}`}
                              strokeDashoffset={`${-2 * Math.PI * 76 * (offeringsRatio + tithesRatio)}`}
                              strokeLinecap="butt"
                            />
                          )}
                        </svg>
                      );
                    })()}
                    
                    {/* Center text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="text-[6px] sm:text-[10px] text-gray-500">Tithes</p>
                      <p className="text-xs sm:text-xl font-bold text-blue-600">
                        {(() => {
                          // Filter transactions by period
                          const now = new Date();
                          let startDate: Date;
                          
                          if (incomeChartPeriod === 'weekly') {
                            const dayOfWeek = now.getDay();
                            startDate = new Date(now);
                            startDate.setDate(now.getDate() - dayOfWeek);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (incomeChartPeriod === 'monthly') {
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                          } else {
                            startDate = new Date(now.getFullYear(), 0, 1);
                          }
                          
                          const periodTransactions = transactions.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate >= startDate && tDate <= now;
                          });
                          
                          const offerings = periodTransactions
                            .filter(t => t.transaction_type === 'offering')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const tithes = periodTransactions
                            .filter(t => t.transaction_type === 'tithe')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const contributions = periodTransactions
                            .filter(t => ['donation', 'project', 'pledge', 'mission'].includes(t.transaction_type))
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          
                          const total = offerings + tithes + contributions;
                          if (total === 0) return '0%';
                          return `${Math.round((tithes / total) * 100)}%`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-2 sm:gap-2.5">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-cyan-400 flex-shrink-0"></div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Offerings</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(() => {
                          // Filter transactions by period
                          const now = new Date();
                          let startDate: Date;
                          
                          if (incomeChartPeriod === 'weekly') {
                            const dayOfWeek = now.getDay();
                            startDate = new Date(now);
                            startDate.setDate(now.getDate() - dayOfWeek);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (incomeChartPeriod === 'monthly') {
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                          } else {
                            startDate = new Date(now.getFullYear(), 0, 1);
                          }
                          
                          const periodTransactions = transactions.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate >= startDate && tDate <= now;
                          });
                          
                          const offerings = periodTransactions
                            .filter(t => t.transaction_type === 'offering')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const tithes = periodTransactions
                            .filter(t => t.transaction_type === 'tithe')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const contributions = periodTransactions
                            .filter(t => ['donation', 'project', 'pledge', 'mission'].includes(t.transaction_type))
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          
                          const total = offerings + tithes + contributions;
                          if (total === 0) return '0%';
                          return `${Math.round((offerings / total) * 100)}%`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-blue-600 flex-shrink-0"></div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tithes</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(() => {
                          // Filter transactions by period
                          const now = new Date();
                          let startDate: Date;
                          
                          if (incomeChartPeriod === 'weekly') {
                            const dayOfWeek = now.getDay();
                            startDate = new Date(now);
                            startDate.setDate(now.getDate() - dayOfWeek);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (incomeChartPeriod === 'monthly') {
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                          } else {
                            startDate = new Date(now.getFullYear(), 0, 1);
                          }
                          
                          const periodTransactions = transactions.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate >= startDate && tDate <= now;
                          });
                          
                          const offerings = periodTransactions
                            .filter(t => t.transaction_type === 'offering')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const tithes = periodTransactions
                            .filter(t => t.transaction_type === 'tithe')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const contributions = periodTransactions
                            .filter(t => ['donation', 'project', 'pledge', 'mission'].includes(t.transaction_type))
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          
                          const total = offerings + tithes + contributions;
                          if (total === 0) return '0%';
                          return `${Math.round((tithes / total) * 100)}%`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-pink-500 flex-shrink-0"></div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contributions</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(() => {
                          // Filter transactions by period
                          const now = new Date();
                          let startDate: Date;
                          
                          if (incomeChartPeriod === 'weekly') {
                            const dayOfWeek = now.getDay();
                            startDate = new Date(now);
                            startDate.setDate(now.getDate() - dayOfWeek);
                            startDate.setHours(0, 0, 0, 0);
                          } else if (incomeChartPeriod === 'monthly') {
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                          } else {
                            startDate = new Date(now.getFullYear(), 0, 1);
                          }
                          
                          const periodTransactions = transactions.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate >= startDate && tDate <= now;
                          });
                          
                          const offerings = periodTransactions
                            .filter(t => t.transaction_type === 'offering')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const tithes = periodTransactions
                            .filter(t => t.transaction_type === 'tithe')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          const contributions = periodTransactions
                            .filter(t => ['donation', 'project', 'pledge', 'mission'].includes(t.transaction_type))
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                          
                          const total = offerings + tithes + contributions;
                          if (total === 0) return '0%';
                          return `${Math.round((contributions / total) * 100)}%`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            {!showAllTransactions ? (
              /* Recent Transactions View */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowAllTransactions(true)}
                    className="text-blue-800 border-blue-800 hover:bg-blue-50"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View All History
                  </Button>
                </div>
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    icon={<DollarSign className="h-16 w-16 text-gray-400" />}
                    title="No Transactions Found"
                    description="No transactions match your current filters."
                    action={{
                      label: "Add First Transaction",
                      onClick: () => setIsAddModalOpen(true)
                    }}
                  />
                ) : (
                  <div className={`sm:rounded-2xl sm:border ${darkMode ? 'sm:bg-slate-800 sm:border-slate-700' : 'sm:bg-white sm:border-gray-200'}`}>
                    <div className="overflow-x-auto">
                      <table className={`min-w-full divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                        <thead className={`hidden sm:table-header-group ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                          <tr>
                            <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Date
                            </th>
                            <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Type & Description
                            </th>
                            <th className={`hidden sm:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Member
                            </th>
                            <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Amount
                            </th>
                            <th className={`hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Method
                            </th>
                            <th className={`hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Status
                            </th>
                            <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                          {filteredTransactions.slice(0, RECENT_TRANSACTIONS_LIMIT).map((transaction) => (
                            <tr key={transaction.id} className={`${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} block sm:table-row border-b sm:border-b-0 ${darkMode ? 'border-slate-700' : 'border-gray-100'} py-3 sm:py-0`}>
                              <td className={`px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'} block sm:table-cell`}>
                                <span className={`sm:hidden text-xs font-medium mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date:</span>
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-4 sm:px-6 py-1 sm:py-4 block sm:table-cell">
                                <div className="flex items-center space-x-2">
                                  {getTransactionTypeIcon(transaction.transaction_type)}
                                  <div>
                                    <Badge 
                                      variant={
                                        ['tithe', 'offering', 'donation'].includes(transaction.transaction_type) ? 'success' :
                                        ['expense', 'welfare'].includes(transaction.transaction_type) ? 'danger' : 'primary'
                                      }
                                    >
                                      {transaction.transaction_type.toUpperCase()}
                                    </Badge>
                                    {transaction.description && (
                                      <p className={`text-xs sm:text-sm mt-1 line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {transaction.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className={`hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {transaction.member ? (
                                  <div>
                                    <p>{transaction.member.first_name} {transaction.member.last_name}</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{transaction.member.member_number}</p>
                                  </div>
                                ) : (
                                  <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Anonymous</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap block sm:table-cell">
                                <span className={`sm:hidden text-xs font-medium mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount:</span>
                                <span className={`text-sm sm:text-sm font-medium ${
                                  ['expense', 'welfare'].includes(transaction.transaction_type) 
                                    ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </td>
                              <td className={`hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                <div className="flex items-center space-x-1">
                                  <CreditCard className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <span>{transaction.payment_method}</span>
                                </div>
                              </td>
                              <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                                {transaction.verified ? (
                                  <Badge variant="success">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="warning">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap text-sm text-gray-500 block sm:table-cell">
                                <div className="flex space-x-1">
                                  {!transaction.verified && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleVerifyTransaction(transaction.id)}
                                      icon={<CheckCircle className="h-4 w-4" />}
                                      className="text-green-600 hover:text-green-700"
                                    />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(transaction)}
                                    icon={<Edit className="h-4 w-4" />}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransaction(transaction);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    icon={<Trash2 className="h-4 w-4" />}
                                    className="text-red-600 hover:text-red-700"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredTransactions.length > RECENT_TRANSACTIONS_LIMIT && (
                      <div className={`mt-4 pt-4 border-t text-center ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <Button
                          variant="outline"
                          onClick={() => setShowAllTransactions(true)}
                          className="text-blue-800 border-blue-800 hover:bg-blue-50"
                        >
                          View {filteredTransactions.length - RECENT_TRANSACTIONS_LIMIT} more transactions
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Full Transaction History View */
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAllTransactions(false)}
                      className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transaction History</h2>
                    <Badge variant="primary">{filteredTransactions.length} transactions</Badge>
                  </div>
                </div>
                
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    icon={<DollarSign className="h-16 w-16 text-gray-400" />}
                    title="No Transactions Found"
                    description="No transactions match your current filters."
                    action={{
                      label: "Add First Transaction",
                      onClick: () => setIsAddModalOpen(true)
                    }}
                  />
                ) : (
                  <Card>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                            <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Date
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Type & Description
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Member
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Amount
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Method
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-gray-200'}`}>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className={darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {getTransactionTypeIcon(transaction.transaction_type)}
                                <div>
                                  <Badge 
                                    variant={
                                      ['tithe', 'offering', 'donation'].includes(transaction.transaction_type) ? 'success' :
                                      ['expense', 'welfare'].includes(transaction.transaction_type) ? 'danger' : 'primary'
                                    }
                                  >
                                    {transaction.transaction_type.toUpperCase()}
                                  </Badge>
                                  {transaction.description && (
                                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {transaction.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {transaction.member ? (
                                <div>
                                  <p>{transaction.member.first_name} {transaction.member.last_name}</p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{transaction.member.member_number}</p>
                                </div>
                              ) : (
                                <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Anonymous</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                ['expense', 'welfare'].includes(transaction.transaction_type) 
                                  ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <div className="flex items-center space-x-1">
                                <CreditCard className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <span>{transaction.payment_method}</span>
                              </div>
                              {transaction.reference_number && (
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Ref: {transaction.reference_number}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {transaction.verified ? (
                                <Badge variant="success">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-1">
                                {!transaction.verified && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerifyTransaction(transaction.id)}
                                    icon={<CheckCircle className="h-4 w-4" />}
                                    className="text-green-600 hover:text-green-700"
                                  />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(transaction)}
                                  icon={<Edit className="h-4 w-4" />}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  icon={<Trash2 className="h-4 w-4" />}
                                  className="text-red-600 hover:text-red-700"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
                )}
              </>
            )}

          {/* Add Transaction Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Add New Transaction"
            size="lg"
          >
            <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as FinancialTransaction['transaction_type'] })}
              required
              options={[
                { value: "offering", label: "Offering" },
                { value: "tithe", label: "Tithe" },
                { value: "donation", label: "Donation" },
                { value: "project", label: "Project" },
                { value: "pledge", label: "Pledge" },
                { value: "mission", label: "Mission" },
                { value: "welfare", label: "Welfare" },
                { value: "expense", label: "Expense" }
              ]}
            />

            <Input
              label="Amount (TZS)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Member (Optional)"
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              options={[
                { value: "", label: "Anonymous" },
                ...members.map(member => ({
                  value: member.id,
                  label: `${member.first_name} ${member.last_name} (#${member.member_number})`
                }))
              ]}
            />

            {!isDepartmentLeader ? (
              <Select
                label="Department (Optional)"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: "", label: "No Department" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName || "Unknown Department"}
                </div>
                <p className="text-xs text-gray-500">All transactions will be assigned to your department</p>
              </div>
            )}

            <Select
              label="Zone (Optional)"
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              options={[
                { value: "", label: "No Zone" },
                ...zones.map(zone => ({ value: zone.id, label: zone.name }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              required
              options={paymentMethods.map(method => ({ value: method, label: method }))}
            />

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Reference Number (Optional)"
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            placeholder="Receipt number, transaction ID, etc."
          />
          
          <TextArea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this transaction"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddTransaction}>
            Add Transaction
          </Button>
        </div>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Transaction"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as FinancialTransaction['transaction_type'] })}
              required
              options={[
                { value: "offering", label: "Offering" },
                { value: "tithe", label: "Tithe" },
                { value: "donation", label: "Donation" },
                { value: "project", label: "Project" },
                { value: "pledge", label: "Pledge" },
                { value: "mission", label: "Mission" },
                { value: "welfare", label: "Welfare" },
                { value: "expense", label: "Expense" }
              ]}
            />

            <Input
              label="Amount (TZS)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Member (Optional)"
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              options={[
                { value: "", label: "Anonymous" },
                ...members.map(member => ({
                  value: member.id,
                  label: `${member.first_name} ${member.last_name} (#${member.member_number})`
                }))
              ]}
            />

            {!isDepartmentLeader ? (
              <Select
                label="Department (Optional)"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: "", label: "No Department" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
              />
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {departmentName}
                </div>
              </div>
            )}

            <Select
              label="Zone (Optional)"
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              options={[
                { value: "", label: "No Zone" },
                ...zones.map(zone => ({ value: zone.id, label: zone.name }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              required
              options={paymentMethods.map(method => ({ value: method, label: method }))}
            />

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Reference Number (Optional)"
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            placeholder="Receipt number, transaction ID, etc."
          />
          
          <TextArea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this transaction"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditTransaction}>
            Update Transaction
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${selectedTransaction?.transaction_type} transaction of ${formatCurrency(selectedTransaction?.amount || 0)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      </div>
    </MainLayout>
  );
}
