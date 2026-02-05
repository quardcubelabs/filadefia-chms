'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { Modal, Button, Input, TextArea, Select, Badge, Card, EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { StrategicPlan, StrategicGoal, StrategicObjective, PlanScope, PlanStatus, TaskPriority, TaskStatus } from '@/types';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
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
  Compass,
  Flag,
  TrendingUp,
  Lightbulb,
  Star,
  ClipboardList
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

export default function StrategicPlansPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const toast = useToast();

  // State
  const [strategicPlans, setStrategicPlans] = useState<StrategicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PlanScope>('church');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StrategicPlan | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoal | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);
  const [planGoals, setPlanGoals] = useState<StrategicGoal[]>([]);
  const [goalObjectives, setGoalObjectives] = useState<Record<string, StrategicObjective[]>>({});
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  
  // My Objectives state (for assigned objectives)
  const [myObjectives, setMyObjectives] = useState<{
    objectives: Array<StrategicObjective & { goal?: { id: string; title: string; status: string; plan?: { id: string; title: string; scope: string } } }>;
    stats: { total: number; completed: number; in_progress: number; pending: number; overdue: number; completion_rate: number };
  }>({ objectives: [], stats: { total: 0, completed: 0, in_progress: 0, pending: 0, overdue: 0, completion_rate: 0 } });
  const [showMyObjectives, setShowMyObjectives] = useState(false);
  const [updatingObjective, setUpdatingObjective] = useState<string | null>(null);

  // Form data
  const currentYear = new Date().getFullYear();
  const [planForm, setPlanForm] = useState({
    title: '',
    vision: '',
    mission: '',
    description: '',
    scope: 'church' as PlanScope,
    department_id: '',
    zone_id: '',
    year_start: currentYear,
    year_end: currentYear + 5,
    status: 'draft' as PlanStatus
  });

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target_metric: '',
    target_value: '',
    current_value: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    progress: 0
  });

  const [objectiveForm, setObjectiveForm] = useState({
    title: '',
    description: '',
    key_result: '',
    assigned_to: '',
    due_date: '',
    status: 'pending' as TaskStatus,
    progress: 0
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
      fetchStrategicPlans();
      fetchDepartments();
      fetchZones();
      fetchMembers();
      fetchMyObjectives();
    }
  }, [authLoading, user, supabase, activeTab]);

  const fetchStrategicPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ scope: activeTab });
      
      const response = await fetch(`/api/strategic-plans?${params}`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setStrategicPlans(result.data || []);
    } catch (error) {
      console.error('Error fetching strategic plans:', error);
      toast.error('Failed to load strategic plans');
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

  // Fetch objectives assigned to the current user
  const fetchMyObjectives = async () => {
    if (!user?.profile?.id) return;
    
    try {
      const response = await fetch(`/api/strategic-plans/my-objectives?member_id=${user.profile.id}`);
      
      if (!response.ok) {
        console.error('Failed to fetch my objectives:', response.status);
        return;
      }
      
      const result = await response.json();
      
      if (result.error) {
        // Silently fail - objectives feature is optional
        console.warn('My objectives not available:', result.error);
        return;
      }
      
      setMyObjectives({
        objectives: result.objectives || [],
        stats: result.stats || { total: 0, completed: 0, in_progress: 0, pending: 0, overdue: 0, completion_rate: 0 }
      });
    } catch (error) {
      // Silently fail - don't break the page if this feature fails
      console.warn('Error fetching my objectives:', error);
    }
  };

  // Update my objective progress
  const handleUpdateMyObjectiveProgress = async (objectiveId: string, progress: number, status?: TaskStatus) => {
    if (!user?.profile?.id) return;
    
    setUpdatingObjective(objectiveId);
    try {
      const response = await fetch('/api/strategic-plans/my-objectives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective_id: objectiveId,
          member_id: user.profile.id,
          progress,
          status
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Progress updated!');
      fetchMyObjectives(); // Refresh the list
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.error('Failed to update progress');
    } finally {
      setUpdatingObjective(null);
    }
  };

  const fetchPlanGoals = async (planId: string) => {
    try {
      const response = await fetch(`/api/strategic-plans/goals?strategic_plan_id=${planId}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setPlanGoals(result.data || []);
      
      // Fetch objectives for each goal
      const objectivesMap: Record<string, StrategicObjective[]> = {};
      for (const goal of (result.data || [])) {
        const objResponse = await fetch(`/api/strategic-plans/objectives?goal_id=${goal.id}`);
        const objResult = await objResponse.json();
        if (!objResult.error) {
          objectivesMap[goal.id] = objResult.data || [];
        }
      }
      setGoalObjectives(objectivesMap);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          created_by: user?.profile?.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Strategic plan created successfully');
      setShowPlanModal(false);
      resetPlanForm();
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create strategic plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlan.id,
          ...planForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Strategic plan updated successfully');
      setShowPlanModal(false);
      resetPlanForm();
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update strategic plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategic plan?')) return;

    try {
      const response = await fetch(`/api/strategic-plans?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Strategic plan deleted successfully');
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete strategic plan');
    }
  };

  const handleCreateGoal = async () => {
    if (!selectedPlan || !goalForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategic_plan_id: selectedPlan.id,
          ...goalForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Goal created successfully');
      setShowGoalModal(false);
      resetGoalForm();
      fetchPlanGoals(selectedPlan.id);
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGoal.id,
          ...goalForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Goal updated successfully');
      setShowGoalModal(false);
      resetGoalForm();
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal and all its objectives?')) return;

    try {
      const response = await fetch(`/api/strategic-plans/goals?id=${goalId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Goal deleted successfully');
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete goal');
    }
  };

  const handleCreateObjective = async () => {
    if (!selectedGoal || !objectiveForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategic_goal_id: selectedGoal.id,
          ...objectiveForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Objective created successfully');
      setShowObjectiveModal(false);
      resetObjectiveForm();
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create objective');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateObjective = async () => {
    if (!selectedObjective) return;

    setSaving(true);
    try {
      const response = await fetch('/api/strategic-plans/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedObjective.id,
          ...objectiveForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Objective updated successfully');
      setShowObjectiveModal(false);
      resetObjectiveForm();
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update objective');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      const response = await fetch(`/api/strategic-plans/objectives?id=${objectiveId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Objective deleted successfully');
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete objective');
    }
  };

  const handleToggleGoalStatus = async (goal: StrategicGoal) => {
    const newStatus = goal.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await fetch('/api/strategic-plans/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goal');
    }
  };

  const handleToggleObjectiveStatus = async (objective: StrategicObjective) => {
    const newStatus = objective.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await fetch('/api/strategic-plans/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: objective.id,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update objective');
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      title: '',
      vision: '',
      mission: '',
      description: '',
      scope: activeTab,
      department_id: '',
      zone_id: '',
      year_start: currentYear,
      year_end: currentYear + 5,
      status: 'draft'
    });
    setSelectedPlan(null);
  };

  const resetGoalForm = () => {
    setGoalForm({
      title: '',
      description: '',
      target_metric: '',
      target_value: '',
      current_value: '',
      priority: 'medium',
      status: 'pending',
      progress: 0
    });
    setSelectedGoal(null);
  };

  const resetObjectiveForm = () => {
    setObjectiveForm({
      title: '',
      description: '',
      key_result: '',
      assigned_to: '',
      due_date: '',
      status: 'pending',
      progress: 0
    });
    setSelectedObjective(null);
  };

  const openEditPlan = (plan: StrategicPlan) => {
    setSelectedPlan(plan);
    setPlanForm({
      title: plan.title,
      vision: plan.vision || '',
      mission: plan.mission || '',
      description: plan.description || '',
      scope: plan.scope,
      department_id: plan.department_id || '',
      zone_id: plan.zone_id || '',
      year_start: plan.year_start,
      year_end: plan.year_end,
      status: plan.status
    });
    setShowPlanModal(true);
  };

  const openViewPlan = async (plan: StrategicPlan) => {
    setSelectedPlan(plan);
    await fetchPlanGoals(plan.id);
    setShowViewModal(true);
  };

  const openEditGoal = (goal: StrategicGoal) => {
    setSelectedGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description || '',
      target_metric: goal.target_metric || '',
      target_value: goal.target_value || '',
      current_value: goal.current_value || '',
      priority: goal.priority,
      status: goal.status,
      progress: goal.progress || 0
    });
    setShowGoalModal(true);
  };

  const handleMarkGoalComplete = async (goal: StrategicGoal) => {
    try {
      const response = await fetch('/api/strategic-plans/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          status: 'completed',
          progress: 100
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Goal marked as completed!');
      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goal');
    }
  };

  const handleUpdateGoalProgress = async (goal: StrategicGoal, progress: number) => {
    try {
      const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
      const response = await fetch('/api/strategic-plans/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          progress,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (selectedPlan) {
        fetchPlanGoals(selectedPlan.id);
      }
      fetchStrategicPlans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update progress');
    }
  };

  const openEditObjective = (objective: StrategicObjective, goal: StrategicGoal) => {
    setSelectedGoal(goal);
    setSelectedObjective(objective);
    setObjectiveForm({
      title: objective.title,
      description: objective.description || '',
      key_result: objective.key_result || '',
      assigned_to: objective.assigned_to || '',
      due_date: objective.due_date || '',
      status: objective.status || 'pending',
      progress: objective.progress || 0
    });
    setShowObjectiveModal(true);
  };

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const canManageCurrentTab = () => {
    if (activeTab === 'church') return canManageChurch;
    if (activeTab === 'department') return canManageDepartment;
    if (activeTab === 'zone') return canManageZone;
    return false;
  };

  const getProgressPercentage = (plan: StrategicPlan) => {
    if (!plan.goal_count || plan.goal_count === 0) return 0;
    return Math.round(((plan.completed_goals || 0) / plan.goal_count) * 100);
  };

  if (authLoading) {
    return (
      <MainLayout title="Strategic Plans">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Strategic Plans" subtitle="Long-term vision and strategic goals">
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

      {/* My Assigned Objectives Section - Shows only if user has assignments */}
      {myObjectives.stats.total > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowMyObjectives(!showMyObjectives)}
            className="w-full flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">My Assigned Objectives</h3>
                <p className="text-sm text-gray-600">
                  {myObjectives.stats.total} objective{myObjectives.stats.total !== 1 ? 's' : ''} assigned to you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                {myObjectives.stats.overdue > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                    {myObjectives.stats.overdue} overdue
                  </span>
                )}
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {myObjectives.stats.in_progress} in progress
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {myObjectives.stats.completed} completed
                </span>
              </div>
              {showMyObjectives ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </div>
          </button>
          
          {showMyObjectives && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Stats Bar */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-sm font-bold text-blue-600">{myObjectives.stats.completion_rate}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${myObjectives.stats.completion_rate}%` }}
                  />
                </div>
              </div>
              
              {/* Objectives List */}
              <div className="divide-y divide-gray-100">
                {myObjectives.objectives.map((obj) => {
                  const isOverdue = obj.due_date && new Date(obj.due_date) < new Date() && obj.status !== 'completed';
                  
                  return (
                    <div key={obj.id} className={`p-4 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{obj.title}</h4>
                            <Badge variant={
                              obj.status === 'completed' ? 'success' :
                              obj.status === 'in_progress' ? 'info' :
                              isOverdue ? 'danger' : 'default'
                            }>
                              {isOverdue && obj.status !== 'completed' ? 'Overdue' : obj.status?.replace('_', ' ') || 'pending'}
                            </Badge>
                          </div>
                          {obj.description && (
                            <p className="text-sm text-gray-600 mb-2">{obj.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {obj.goal && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Goal: {obj.goal.title}
                              </span>
                            )}
                            {obj.goal?.plan && (
                              <span className="flex items-center gap-1">
                                <Compass className="h-3 w-3" />
                                {obj.goal.plan.title}
                              </span>
                            )}
                            {obj.due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" />
                                Due: {new Date(obj.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Control */}
                        <div className="flex flex-col items-end gap-2 min-w-[150px]">
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={obj.progress || 0}
                              onChange={(e) => {
                                const newProgress = parseInt(e.target.value);
                                handleUpdateMyObjectiveProgress(obj.id, newProgress);
                              }}
                              disabled={updatingObjective === obj.id || obj.status === 'completed'}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                            />
                            <span className="text-sm font-medium text-blue-600 w-10 text-right">
                              {obj.progress || 0}%
                            </span>
                          </div>
                          {obj.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateMyObjectiveProgress(obj.id, 100, 'completed')}
                              disabled={updatingObjective === obj.id}
                              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              {updatingObjective === obj.id ? 'Updating...' : 'Mark Complete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {scopeLabels[activeTab]} Strategic Plans
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {strategicPlans.length} strategic plan{strategicPlans.length !== 1 ? 's' : ''}
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
            Add Strategic Plan
          </Button>
        )}
      </div>

      {/* Strategic Plans List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : strategicPlans.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-12 w-12" />}
          title="No Strategic Plans"
          description={`No ${scopeLabels[activeTab].toLowerCase()} strategic plans have been created yet.`}
          action={
            canManageCurrentTab() ? {
              label: 'Create Strategic Plan',
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategic Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Years</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Goals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {strategicPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openViewPlan(plan)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Compass className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{plan.title}</p>
                          {plan.vision && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{plan.vision}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {plan.year_start} - {plan.year_end}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        {plan.completed_goals || 0} / {plan.goal_count || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${getProgressPercentage(plan)}%` }}></div>
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
        title={selectedPlan ? 'Edit Strategic Plan' : 'Create Strategic Plan'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={planForm.title}
            onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
            placeholder="Enter strategic plan title"
          />

          <TextArea
            label="Vision"
            value={planForm.vision}
            onChange={(e) => setPlanForm({ ...planForm, vision: e.target.value })}
            placeholder="What is the long-term vision?"
            rows={2}
          />

          <TextArea
            label="Mission"
            value={planForm.mission}
            onChange={(e) => setPlanForm({ ...planForm, mission: e.target.value })}
            placeholder="What is the mission to achieve this vision?"
            rows={2}
          />

          <TextArea
            label="Description"
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
            placeholder="Additional description"
            rows={2}
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
              label="Start Year *"
              type="number"
              value={planForm.year_start}
              onChange={(e) => setPlanForm({ ...planForm, year_start: parseInt(e.target.value) })}
              min={2020}
              max={2100}
            />
            <Input
              label="End Year *"
              type="number"
              value={planForm.year_end}
              onChange={(e) => setPlanForm({ ...planForm, year_end: parseInt(e.target.value) })}
              min={planForm.year_start}
              max={2100}
            />
          </div>
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

      {/* View Plan Modal with Goals */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPlan(null);
          setPlanGoals([]);
          setGoalObjectives({});
          setExpandedGoals(new Set());
        }}
        title={selectedPlan?.title || 'Strategic Plan Details'}
        size="xl"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              {selectedPlan.vision && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-1">
                    <Lightbulb className="h-4 w-4" />
                    Vision
                  </div>
                  <p className="text-gray-700">{selectedPlan.vision}</p>
                </div>
              )}
              {selectedPlan.mission && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-1">
                    <Flag className="h-4 w-4" />
                    Mission
                  </div>
                  <p className="text-gray-700">{selectedPlan.mission}</p>
                </div>
              )}
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
                  <p className="font-medium mt-1">{selectedPlan.year_start} - {selectedPlan.year_end}</p>
                </div>
                <div>
                  <span className="text-gray-500">Progress</span>
                  <p className="font-medium mt-1">{getProgressPercentage(selectedPlan)}%</p>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Strategic Goals
                </h3>
                {canManageCurrentTab() && (
                  <Button size="sm" onClick={() => {
                    resetGoalForm();
                    setShowGoalModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                )}
              </div>

              {planGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No strategic goals defined yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`border rounded-lg overflow-hidden ${
                        goal.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Goal Header */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleGoalStatus(goal)}
                            className={`mt-0.5 p-1 rounded ${
                              goal.status === 'completed'
                                ? 'text-green-600 hover:bg-green-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  goal.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {goal.title}
                                </h4>
                                {goal.description && (
                                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                                )}
                                {(goal.target_metric || goal.target_value) && (
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    {goal.target_metric && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {goal.target_metric}: {goal.target_value || 'N/A'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[goal.priority]}`}>
                                  {goal.priority}
                                </span>
                                <button
                                  onClick={() => toggleGoalExpanded(goal.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                >
                                  {expandedGoals.has(goal.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{goal.objective_count || 0} objectives</span>
                                <span className="font-medium">{goal.progress || 0}% complete</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    goal.status === 'completed' ? 'bg-green-500' : 
                                    goal.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${goal.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          {canManageCurrentTab() && (
                            <div className="flex gap-1">
                              {goal.status !== 'completed' && (
                                <button
                                  onClick={() => handleMarkGoalComplete(goal)}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                                  title="Mark as Complete"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditGoal(goal)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Edit Goal"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Delete Goal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Objectives (expanded) */}
                      {expandedGoals.has(goal.id) && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-sm font-medium text-gray-700">Key Objectives</h5>
                            {canManageCurrentTab() && (
                              <button
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  resetObjectiveForm();
                                  setShowObjectiveModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Objective
                              </button>
                            )}
                          </div>
                          
                          {(!goalObjectives[goal.id] || goalObjectives[goal.id].length === 0) ? (
                            <p className="text-sm text-gray-500 text-center py-2">No objectives defined</p>
                          ) : (
                            <div className="space-y-2">
                              {goalObjectives[goal.id].map((objective) => (
                                <div
                                  key={objective.id}
                                  className={`p-3 rounded-lg border ${
                                    objective.status === 'completed' 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => handleToggleObjectiveStatus(objective)}
                                      className={`mt-0.5 p-1 rounded-full transition-colors ${
                                        objective.status === 'completed'
                                          ? 'text-green-600 bg-green-100'
                                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                      }`}
                                      title={objective.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${
                                        objective.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'
                                      }`}>
                                        {objective.title}
                                      </p>
                                      {objective.key_result && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          <span className="font-medium">Key Result:</span> {objective.key_result}
                                        </p>
                                      )}
                                      
                                      {/* Progress bar for objective */}
                                      {objective.status !== 'completed' && (
                                        <div className="mt-2">
                                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{objective.progress || 0}% complete</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full transition-all ${
                                                (objective.progress || 0) >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                              }`}
                                              style={{ width: `${objective.progress || 0}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                        {objective.assignee && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                            <Users className="h-3 w-3" />
                                            {objective.assignee.first_name} {objective.assignee.last_name}
                                          </span>
                                        )}
                                        {objective.due_date && (
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                            new Date(objective.due_date) < new Date() && objective.status !== 'completed'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            <Clock className="h-3 w-3" />
                                            Due: {new Date(objective.due_date).toLocaleDateString()}
                                          </span>
                                        )}
                                        <Badge variant={
                                          objective.status === 'completed' ? 'success' :
                                          objective.status === 'in_progress' ? 'info' :
                                          objective.status === 'cancelled' ? 'danger' :
                                          objective.status === 'overdue' ? 'warning' : 'default'
                                        }>
                                          {objective.status?.replace('_', ' ') || 'pending'}
                                        </Badge>
                                      </div>
                                    </div>
                                    {canManageCurrentTab() && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => openEditObjective(objective, goal)}
                                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                          title="Edit Objective"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteObjective(objective.id)}
                                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                                          title="Delete Objective"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          resetGoalForm();
        }}
        title={selectedGoal ? 'Edit Goal' : 'Add Strategic Goal'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Goal Title *"
            value={goalForm.title}
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            placeholder="Enter goal title"
          />

          <TextArea
            label="Description"
            value={goalForm.description}
            onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            placeholder="Describe this goal"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Metric"
              value={goalForm.target_metric}
              onChange={(e) => setGoalForm({ ...goalForm, target_metric: e.target.value })}
              placeholder="e.g., Membership Growth"
            />
            <Input
              label="Target Value"
              value={goalForm.target_value}
              onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
              placeholder="e.g., 500 members"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Value"
              value={goalForm.current_value}
              onChange={(e) => setGoalForm({ ...goalForm, current_value: e.target.value })}
              placeholder="e.g., 350 members"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={goalForm.progress}
                onChange={(e) => setGoalForm({ ...goalForm, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-medium text-blue-600">{goalForm.progress}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={goalForm.priority}
              onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as TaskPriority })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />
            <Select
              label="Status"
              value={goalForm.status}
              onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as TaskStatus })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => {
            setShowGoalModal(false);
            resetGoalForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={selectedGoal ? handleUpdateGoal : handleCreateGoal}
            disabled={saving}
          >
            {saving ? 'Saving...' : selectedGoal ? 'Update' : 'Add Goal'}
          </Button>
        </div>
      </Modal>

      {/* Objective Modal */}
      <Modal
        isOpen={showObjectiveModal}
        onClose={() => {
          setShowObjectiveModal(false);
          resetObjectiveForm();
        }}
        title={selectedObjective ? 'Edit Objective' : 'Add Objective'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Objective Title *"
            value={objectiveForm.title}
            onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
            placeholder="Enter objective title"
          />

          <TextArea
            label="Description"
            value={objectiveForm.description}
            onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
            placeholder="Describe this objective"
            rows={2}
          />

          <Input
            label="Key Result"
            value={objectiveForm.key_result}
            onChange={(e) => setObjectiveForm({ ...objectiveForm, key_result: e.target.value })}
            placeholder="What is the measurable outcome?"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assign To"
              value={objectiveForm.assigned_to}
              onChange={(e) => setObjectiveForm({ ...objectiveForm, assigned_to: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...members.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              value={objectiveForm.due_date}
              onChange={(e) => setObjectiveForm({ ...objectiveForm, due_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={objectiveForm.status}
              onChange={(e) => setObjectiveForm({ ...objectiveForm, status: e.target.value as TaskStatus })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={objectiveForm.progress}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-medium text-blue-600">{objectiveForm.progress}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {objectiveForm.assigned_to && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The assigned person will be able to see this objective in their dashboard and update its progress.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => {
            setShowObjectiveModal(false);
            resetObjectiveForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={selectedObjective ? handleUpdateObjective : handleCreateObjective}
            disabled={saving}
          >
            {saving ? 'Saving...' : selectedObjective ? 'Update' : 'Add Objective'}
          </Button>
        </div>
      </Modal>
      </div>
    </MainLayout>
  );
}
