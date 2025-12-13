'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import Sidebar from '@/components/Sidebar';
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
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  
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
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
    if (user) {
      loadTransactions();
      loadDepartments();
      loadMembers();
    }
  }, [user, authLoading]);

  const loadTransactions = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setError('Database connection not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to load financial transactions...');
      
      // Test basic table access first
      const { count, error: countError } = await supabase
        .from('financial_transactions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Table access error:', countError);
        throw new Error(`Cannot access financial_transactions table: ${countError.message}`);
      }

      console.log('Financial transactions count:', count);

      if (count === 0) {
        console.log('No transactions found. Database appears empty.');
        setError(`No financial transactions found. The database appears empty.
        
To populate with sample data:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor  
3. Run the seed_finances.sql script from the database folder
4. Refresh this page

You can also click the "Seed Sample Data" button below to add test transactions.`);
        setTransactions([]);
        calculateSummary([]);
        setLoading(false);
        return;
      }
      
      // Now fetch actual data - first try simple query without joins
      console.log('Fetching transactions (simple query first)...');
      let simpleQuery = supabase
        .from('financial_transactions')
        .select('*');

      // Filter by department for department leaders
      if (isDepartmentLeader && departmentId) {
        simpleQuery = simpleQuery.eq('department_id', departmentId);
      }

      const { data: simpleData, error: simpleError } = await simpleQuery
        .order('date', { ascending: false });

      console.log('Simple query result - Data:', simpleData, 'Error:', simpleError);

      if (simpleError) {
        console.error('Simple query failed:', simpleError);
        throw simpleError;
      }

      if (!simpleData || simpleData.length === 0) {
        console.log('No data returned from simple query');
        throw new Error('No financial transactions found after seeding. This might be an RLS (Row Level Security) issue.');
      }

      // If simple query works, try with joins
      console.log('Simple query successful, now trying with joins...');
      let transactionsQuery = supabase
        .from('financial_transactions')
        .select(`
          *,
          member:members(first_name, last_name, member_number),
          department:departments(name)
        `);

      // Filter by department for department leaders
      if (isDepartmentLeader && departmentId) {
        transactionsQuery = transactionsQuery.eq('department_id', departmentId);
      }

      const { data, error } = await transactionsQuery
        .order('date', { ascending: false });

      console.log('Join query result - Data:', data, 'Error:', error);

      if (error) {
        console.error('Join query error:', error);
        // If join query fails but simple query worked, fall back to simple data
        if (simpleData && simpleData.length > 0) {
          console.log('Using simple data without joins due to join error');
          setTransactions(simpleData || []);
          calculateSummary(simpleData || []);
          setError(`Loaded ${simpleData.length} transactions (without member/department details due to join error: ${error.message})`);
          setLoading(false);
          return;
        }
        throw error;
      }

      console.log('Successfully loaded transactions:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample transaction data:', data[0]);
        console.log('All transaction data sample:', data.slice(0, 3));
      }
      setTransactions(data || []);
      calculateSummary(data || []);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Failed to load financial transactions');
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
    const matchesDepartment = filterDepartment === 'all' || transaction.department_id === filterDepartment;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
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

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
                <p className="text-gray-600 mt-1">Track church income, expenses, and financial health</p>
                {transactions.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">{transactions.length} transactions loaded</p>
                )}
              </div>
              <div className="flex space-x-3">
                {transactions.length === 0 && !loading && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={loadTransactions}
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      Reload Data
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={seedSampleData}
                      disabled={seeding}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      {seeding ? 'Adding Sample Data...' : 'Add Sample Data'}
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline"
                  icon={<BarChart3 className="h-4 w-4" />}
                  onClick={() => router.push('/reports')}
                >
                  View Reports
                </Button>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Transaction
                </Button>
              </div>
            </div>

            {/* Department Access Notification */}
            {isDepartmentLeader && departmentName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">Department Finances: {departmentName}</h3>
                    <p className="text-green-700 text-sm mt-1">
                      You can view and manage financial transactions for your department only.
                    </p>
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

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary.totalIncome)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This month: {formatCurrency(summary.monthlyIncome)}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary.totalExpenses)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This month: {formatCurrency(summary.monthlyExpenses)}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Amount</p>
                      <p className={`text-2xl font-bold ${
                        summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(summary.netAmount)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      summary.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign className={`h-6 w-6 ${
                        summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Monthly net: {formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.recentTransactions}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Receipt className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {summary.unverifiedCount} unverified
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  <div className="md:col-span-2">
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
                  <Select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    placeholder="Department"
                    options={[
                      { value: "all", label: "All Departments" },
                      ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                    ]}
                  />
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
          </div>
        </div>
      </div>

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
  );
}
