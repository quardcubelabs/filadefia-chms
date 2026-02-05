'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { Modal, Button, Input, TextArea, Select, Badge, Card, EmptyState, Loading } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { WorkPlan, WorkPlanTask, PlanScope, PlanStatus, TaskPriority, TaskStatus } from '@/types';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  CheckSquare,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Target,
  Users,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  ListTodo,
  TrendingUp
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
}

interface Zone {
  id: string;
  name: string;
  swahili_name?: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

const scopeLabels: Record<PlanScope, string> = {
  church: 'Church-wide',
  department: 'Department',
  zone: 'Zone'
};

const statusColors: Record<PlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700'
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

const taskStatusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  overdue: 'bg-red-100 text-red-700'
};

export default function WorkPlansPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const toast = useToast();

  // State
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PlanScope>('church');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkPlan | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkPlanTask | null>(null);
  const [planTasks, setPlanTasks] = useState<WorkPlanTask[]>([]);
  const [saving, setSaving] = useState(false);

  // Form data
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    scope: 'church' as PlanScope,
    department_id: '',
    zone_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'draft' as PlanStatus,
    budget: '',
    notes: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    start_date: '',
    due_date: '',
    notes: ''
  });

  // Check user permissions
  const userRole = user?.profile?.role;
  const canManageChurch = userRole === 'administrator' || userRole === 'pastor';
  const canManageDepartment = userRole === 'department_leader' || canManageChurch;
  const canManageZone = userRole === 'zone_leader' || canManageChurch;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && supabase) {
      fetchWorkPlans();
      fetchDepartments();
      fetchZones();
      fetchMembers();
    }
  }, [authLoading, user, supabase, activeTab]);

  const fetchWorkPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ scope: activeTab });
      
      const response = await fetch(`/api/work-plans?${params}`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setWorkPlans(result.data || []);
    } catch (error) {
      console.error('Error fetching work plans:', error);
      toast.error('Failed to load work plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('departments')
      .select('id, name, swahili_name')
      .eq('is_active', true)
      .order('name');
    setDepartments(data || []);
  };

  const fetchZones = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('zones')
      .select('id, name, swahili_name')
      .eq('is_active', true)
      .order('name');
    setZones(data || []);
  };

  const fetchMembers = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('status', 'active')
      .order('first_name');
    setMembers(data || []);
  };

  const fetchPlanTasks = async (planId: string) => {
    try {
      const response = await fetch(`/api/work-plans/tasks?work_plan_id=${planId}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setPlanTasks(result.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title || !planForm.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/work-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          budget: planForm.budget ? parseFloat(planForm.budget) : null,
          created_by: user?.profile?.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Work plan created successfully');
      setShowPlanModal(false);
      resetPlanForm();
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create work plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    setSaving(true);
    try {
      const response = await fetch('/api/work-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlan.id,
          ...planForm,
          budget: planForm.budget ? parseFloat(planForm.budget) : null
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Work plan updated successfully');
      setShowPlanModal(false);
      resetPlanForm();
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update work plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work plan?')) return;

    try {
      const response = await fetch(`/api/work-plans?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Work plan deleted successfully');
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete work plan');
    }
  };

  const handleCreateTask = async () => {
    if (!selectedPlan || !taskForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/work-plans/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_plan_id: selectedPlan.id,
          ...taskForm,
          created_by: user?.profile?.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Task created successfully');
      setShowTaskModal(false);
      resetTaskForm();
      fetchPlanTasks(selectedPlan.id);
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    setSaving(true);
    try {
      const response = await fetch('/api/work-plans/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTask.id,
          ...taskForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Task updated successfully');
      setShowTaskModal(false);
      resetTaskForm();
      if (selectedPlan) {
        fetchPlanTasks(selectedPlan.id);
      }
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/work-plans/tasks?id=${taskId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Task deleted successfully');
      if (selectedPlan) {
        fetchPlanTasks(selectedPlan.id);
      }
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const handleToggleTaskStatus = async (task: WorkPlanTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await fetch('/api/work-plans/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (selectedPlan) {
        fetchPlanTasks(selectedPlan.id);
      }
      fetchWorkPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      title: '',
      description: '',
      scope: activeTab,
      department_id: '',
      zone_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'draft',
      budget: '',
      notes: ''
    });
    setSelectedPlan(null);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
      start_date: '',
      due_date: '',
      notes: ''
    });
    setSelectedTask(null);
  };

  const openEditPlan = (plan: WorkPlan) => {
    setSelectedPlan(plan);
    setPlanForm({
      title: plan.title,
      description: plan.description || '',
      scope: plan.scope,
      department_id: plan.department_id || '',
      zone_id: plan.zone_id || '',
      start_date: plan.start_date,
      end_date: plan.end_date,
      status: plan.status,
      budget: plan.budget?.toString() || '',
      notes: plan.notes || ''
    });
    setShowPlanModal(true);
  };

  const openViewPlan = async (plan: WorkPlan) => {
    setSelectedPlan(plan);
    await fetchPlanTasks(plan.id);
    setShowViewModal(true);
  };

  const openEditTask = (task: WorkPlanTask) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      notes: task.notes || ''
    });
    setShowTaskModal(true);
  };

  const canManageCurrentTab = () => {
    if (activeTab === 'church') return canManageChurch;
    if (activeTab === 'department') return canManageDepartment;
    if (activeTab === 'zone') return canManageZone;
    return false;
  };

  const getProgressPercentage = (plan: WorkPlan) => {
    if (!plan.task_count || plan.task_count === 0) return 0;
    return Math.round(((plan.completed_tasks || 0) / plan.task_count) * 100);
  };

  if (authLoading) {
    return (
      <MainLayout title="Work Plans">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Work Plans" subtitle="Manage operational work plans and tasks">
      <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="mb-4 md:mb-6">
        <nav className="flex space-x-0 overflow-x-auto">
          {(['church', 'department', 'zone'] as PlanScope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveTab(scope)}
              className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === scope
                  ? 'bg-red-100 text-red-600 rounded-tl-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {scope === 'church' && <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              {scope === 'department' && <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              {scope === 'zone' && <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              <span>{scopeLabels[scope]}</span>
              {activeTab === scope && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {scopeLabels[activeTab]} Work Plans
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {workPlans.length} work plan{workPlans.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManageCurrentTab() && (
          <Button
            onClick={() => {
              resetPlanForm();
              setPlanForm(prev => ({ ...prev, scope: activeTab }));
              setShowPlanModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Work Plan
          </Button>
        )}
      </div>

      {/* Work Plans List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      ) : workPlans.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-12 w-12" />}
          title="No Work Plans"
          description={`No ${scopeLabels[activeTab].toLowerCase()} work plans have been created yet.`}
          action={
            canManageCurrentTab() ? {
              label: 'Create Work Plan',
              onClick: () => {
                resetPlanForm();
                setPlanForm(prev => ({ ...prev, scope: activeTab }));
                setShowPlanModal(true);
              },
              icon: <Plus className="h-4 w-4" />
            } : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tasks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openViewPlan(plan)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <ListTodo className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{plan.title}</p>
                          {plan.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{plan.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-xs">
                          {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {plan.completed_tasks || 0} / {plan.task_count || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getProgressPercentage(plan)}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-600">{getProgressPercentage(plan)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>
                        {plan.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openViewPlan(plan)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canManageCurrentTab() && (
                          <>
                            <button
                              onClick={() => openEditPlan(plan)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          resetPlanForm();
        }}
        title={selectedPlan ? 'Edit Work Plan' : 'Create Work Plan'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={planForm.title}
            onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
            placeholder="Enter work plan title"
          />

          <TextArea
            label="Description"
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
            placeholder="Describe the work plan objectives"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Scope *"
              value={planForm.scope}
              onChange={(e) => setPlanForm({ ...planForm, scope: e.target.value as PlanScope })}
              options={[
                { value: 'church', label: 'Church-wide' },
                { value: 'department', label: 'Department' },
                { value: 'zone', label: 'Zone' }
              ]}
            />

            <Select
              label="Status"
              value={planForm.status}
              onChange={(e) => setPlanForm({ ...planForm, status: e.target.value as PlanStatus })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>

          {planForm.scope === 'department' && (
            <Select
              label="Department *"
              value={planForm.department_id}
              onChange={(e) => setPlanForm({ ...planForm, department_id: e.target.value })}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]}
            />
          )}

          {planForm.scope === 'zone' && (
            <Select
              label="Zone *"
              value={planForm.zone_id}
              onChange={(e) => setPlanForm({ ...planForm, zone_id: e.target.value })}
              options={[
                { value: '', label: 'Select Zone' },
                ...zones.map(z => ({ value: z.id, label: z.name }))
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={planForm.start_date}
              onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
            />
            <Input
              label="End Date *"
              type="date"
              value={planForm.end_date}
              onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
            />
          </div>

          <Input
            label="Budget (TZS)"
            type="number"
            value={planForm.budget}
            onChange={(e) => setPlanForm({ ...planForm, budget: e.target.value })}
            placeholder="0"
          />

          <TextArea
            label="Notes"
            value={planForm.notes}
            onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => {
            setShowPlanModal(false);
            resetPlanForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={selectedPlan ? handleUpdatePlan : handleCreatePlan}
            disabled={saving}
          >
            {saving ? 'Saving...' : selectedPlan ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* View Plan Modal with Tasks */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPlan(null);
          setPlanTasks([]);
        }}
        title={selectedPlan?.title || 'Work Plan Details'}
        size="xl"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedPlan.status]}`}>
                      {selectedPlan.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Scope</span>
                  <p className="font-medium mt-1">{scopeLabels[selectedPlan.scope]}</p>
                </div>
                <div>
                  <span className="text-gray-500">Duration</span>
                  <p className="font-medium mt-1">
                    {new Date(selectedPlan.start_date).toLocaleDateString()} - {new Date(selectedPlan.end_date).toLocaleDateString()}
                  </p>
                </div>
                {selectedPlan.budget && (
                  <div>
                    <span className="text-gray-500">Budget</span>
                    <p className="font-medium mt-1">TZS {selectedPlan.budget.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {selectedPlan.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Description</span>
                  <p className="mt-1 text-gray-700">{selectedPlan.description}</p>
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tasks</h3>
                {canManageCurrentTab() && (
                  <Button size="sm" onClick={() => {
                    resetTaskForm();
                    setShowTaskModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                )}
              </div>

              {planTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 ${
                        task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 p-1 rounded ${
                            task.status === 'completed'
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${
                                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {task.assignee && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.assignee.first_name} {task.assignee.last_name}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManageCurrentTab() && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditTask(task)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          resetTaskForm();
        }}
        title={selectedTask ? 'Edit Task' : 'Add Task'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Enter task title"
          />

          <TextArea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Task description"
            rows={3}
          />

          <Select
            label="Assign To"
            value={taskForm.assigned_to}
            onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
            options={[
              { value: '', label: 'Unassigned' },
              ...members.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))
            ]}
          />

          <Select
            label="Priority"
            value={taskForm.priority}
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={taskForm.start_date}
              onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
            />
          </div>

          <TextArea
            label="Notes"
            value={taskForm.notes}
            onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => {
            setShowTaskModal(false);
            resetTaskForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={selectedTask ? handleUpdateTask : handleCreateTask}
            disabled={saving}
          >
            {saving ? 'Saving...' : selectedTask ? 'Update' : 'Add Task'}
          </Button>
        </div>
      </Modal>
      </div>
    </MainLayout>
  );
}
