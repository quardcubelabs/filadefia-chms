'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
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
  AlertCircle
} from 'lucide-react';

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
  
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
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
    
    // Only load data once both auth and department access are resolved
    if (user && !authLoading && !departmentLoading) {
      console.log('🔄 Loading finance data - auth and department ready');
      console.log('  - User:', user.email);
      console.log('  - isDepartmentLeader:', isDepartmentLeader);
      console.log('  - departmentId:', departmentId);
      console.log('  - departmentName:', departmentName);
      
      loadTransactions();
      loadDepartments();
      loadMembers();
    }
  }, [user, authLoading, departmentLoading]); // Removed isDepartmentLeader and departmentId to prevent re-loading

  const loadTransactions = async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading financial transactions...');
      console.log('User role:', user.profile?.role);
      console.log('Is Department Leader:', isDepartmentLeader);
      console.log('Department:', departmentName);
      
      // Build query - filter by department if user is a department leader
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          member:members(first_name, last_name, member_number),
          department:departments(name)
        `);

      // If user is a department leader, filter by their department
      if (isDepartmentLeader && departmentId) {
        console.log('Filtering by department ID:', departmentId);
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} transactions (filtered by RLS)`);
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
      pledge: 'bg-yellow-100 text-yellow-800',
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

        {/* Department Quick Actions */}
        {isDepartmentLeader && departmentName && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-green-900">Quick Actions for {departmentName}</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Manage your department's financial activities efficiently
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Income
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setFormData(prev => ({ ...prev, transaction_type: 'expense' as const }));
                  }}
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
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

            {/* Department Access Notification */}
            {isDepartmentLeader && departmentName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Department Financial View - {departmentName}
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You are viewing financial transactions for your department only. All summary statistics reflect transactions specific to {departmentName}.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <Card padding="sm" rounded="xl">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Income</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 truncate">
                        {formatCurrency(summary.totalIncome)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0 ml-2">
                      <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2 truncate">
                    This month: {formatCurrency(summary.monthlyIncome)}
                  </p>
                </CardBody>
              </Card>

              <Card padding="sm" rounded="xl">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Expenses</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 truncate">
                        {formatCurrency(summary.totalExpenses)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0 ml-2">
                      <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2 truncate">
                    This month: {formatCurrency(summary.monthlyExpenses)}
                  </p>
                </CardBody>
              </Card>

              <Card padding="sm" rounded="xl">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Net Amount</p>
                      <p className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${
                        summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(summary.netAmount)}
                      </p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 ${
                      summary.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign className={`h-4 w-4 sm:h-6 sm:w-6 ${
                        summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2 truncate">
                    Monthly: {formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}
                  </p>
                </CardBody>
              </Card>

              <Card padding="sm" rounded="xl">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Recent Activity</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                        {summary.recentTransactions}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0 ml-2">
                      <Receipt className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">
                    {summary.unverifiedCount} unverified
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-4 sm:mb-6" padding="sm" rounded="xl">
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    placeholder="Transaction Type"
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
                      options={[
                        { value: "all", label: "All Departments" },
                        ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                      ]}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    placeholder="Payment Method"
                    options={[
                      { value: "all", label: "All Methods" },
                      ...paymentMethods.map(method => ({ value: method, label: method }))
                    ]}
                  />
                  <Select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value)}
                    placeholder="Verification"
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "verified", label: "Verified" },
                      { value: "unverified", label: "Unverified" }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="From Date"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Transactions List */}
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
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type & Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                                    <p className="text-sm text-gray-600 mt-1">
                                      {transaction.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.member ? (
                                <div>
                                  <p>{transaction.member.first_name} {transaction.member.last_name}</p>
                                  <p className="text-xs text-gray-500">#{transaction.member.member_number}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">Anonymous</span>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span>{transaction.payment_method}</span>
                              </div>
                              {transaction.reference_number && (
                                <p className="text-xs text-gray-500">
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
