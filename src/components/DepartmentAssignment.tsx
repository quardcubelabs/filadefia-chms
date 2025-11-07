'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, Select, Alert, Loading } from '@/components/ui';
import { Users, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
}

interface DepartmentMembership {
  id: string;
  department_id: string;
  member_id: string;
  position: 'chairperson' | 'secretary' | 'treasurer' | 'coordinator' | 'member';
  joined_date: string;
  is_active: boolean;
  department?: Department;
}

interface DepartmentAssignmentProps {
  memberId: string;
  supabase: any;
  onUpdate?: () => void;
}

const POSITION_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'chairperson', label: 'Chairperson' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'coordinator', label: 'Coordinator' },
];

export default function DepartmentAssignment({ memberId, supabase, onUpdate }: DepartmentAssignmentProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [memberDepartments, setMemberDepartments] = useState<DepartmentMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for adding new department
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('member');

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all departments
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (deptsError) throw deptsError;
      setDepartments(depts || []);

      // Fetch member's current department assignments
      const { data: memberDepts, error: memberDeptsError } = await supabase
        .from('department_members')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('member_id', memberId)
        .eq('is_active', true);

      if (memberDeptsError) throw memberDeptsError;
      setMemberDepartments(memberDepts || []);

    } catch (err: any) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!selectedDepartmentId) {
      setError('Please select a department');
      return;
    }

    // Check if member is already in this department
    const existing = memberDepartments.find(
      md => md.department_id === selectedDepartmentId && md.is_active
    );

    if (existing) {
      setError('Member is already assigned to this department');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { error: insertError } = await supabase
        .from('department_members')
        .insert([{
          department_id: selectedDepartmentId,
          member_id: memberId,
          position: selectedPosition,
          joined_date: new Date().toISOString().split('T')[0],
          is_active: true,
        }]);

      if (insertError) throw insertError;

      setSuccess('Department assignment added successfully');
      setShowAddForm(false);
      setSelectedDepartmentId('');
      setSelectedPosition('member');
      
      // Refresh data
      await fetchData();
      
      if (onUpdate) onUpdate();

    } catch (err: any) {
      setError(err.message || 'Failed to add department assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePosition = async (assignmentId: string, newPosition: string) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('department_members')
        .update({ position: newPosition })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      setSuccess('Position updated successfully');
      await fetchData();
      
      if (onUpdate) onUpdate();

    } catch (err: any) {
      setError(err.message || 'Failed to update position');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDepartment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this department assignment?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('department_members')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      setSuccess('Department assignment removed successfully');
      await fetchData();
      
      if (onUpdate) onUpdate();

    } catch (err: any) {
      setError(err.message || 'Failed to remove department assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getPositionBadge = (position: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      chairperson: 'success',
      secretary: 'info',
      treasurer: 'warning',
      coordinator: 'info',
      member: 'default',
    };
    
    return (
      <Badge variant={variants[position] || 'default'}>
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </Badge>
    );
  };

  const availableDepartments = departments.filter(
    dept => !memberDepartments.find(md => md.department_id === dept.id && md.is_active)
  );

  if (loading) {
    return (
      <div className="py-8">
        <Loading text="Loading departments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-tag-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-tag-red-600" />
          Department Assignments
        </h3>
        {!showAddForm && availableDepartments.length > 0 && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={submitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Add Department Form */}
      {showAddForm && (
        <div className="bg-tag-gray-50 border border-tag-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-tag-gray-900">Assign to Department</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-tag-gray-700 mb-2">
                Department
              </label>
              <Select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                options={[
                  { value: '', label: 'Select a department...' },
                  ...availableDepartments.map(dept => ({
                    value: dept.id,
                    label: dept.name,
                  })),
                ]}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-tag-gray-700 mb-2">
                Position
              </label>
              <Select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                options={POSITION_OPTIONS}
                fullWidth
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setSelectedDepartmentId('');
                setSelectedPosition('member');
                setError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDepartment}
              disabled={submitting || !selectedDepartmentId}
            >
              {submitting ? 'Adding...' : 'Add Assignment'}
            </Button>
          </div>
        </div>
      )}

      {/* Current Departments List */}
      <div className="space-y-3">
        {memberDepartments.length === 0 ? (
          <div className="text-center py-8 bg-tag-gray-50 rounded-lg border border-dashed border-tag-gray-300">
            <Users className="h-12 w-12 text-tag-gray-400 mx-auto mb-3" />
            <p className="text-tag-gray-600 font-medium mb-2">No department assignments</p>
            <p className="text-sm text-tag-gray-500 mb-4">
              This member is not assigned to any departments yet
            </p>
            {availableDepartments.length > 0 && !showAddForm && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign First Department
              </Button>
            )}
          </div>
        ) : (
          memberDepartments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 bg-white border border-tag-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-tag-gray-900">
                    {assignment.department?.name}
                  </h4>
                  {getPositionBadge(assignment.position)}
                </div>
                {assignment.department?.swahili_name && (
                  <p className="text-sm text-tag-gray-600 mb-1">
                    {assignment.department.swahili_name}
                  </p>
                )}
                <p className="text-xs text-tag-gray-500">
                  Joined: {new Date(assignment.joined_date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={assignment.position}
                  onChange={(e) => handleUpdatePosition(assignment.id, e.target.value)}
                  options={POSITION_OPTIONS}
                  disabled={submitting}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDepartment(assignment.id)}
                  disabled={submitting}
                >
                  <Trash2 className="h-4 w-4 text-tag-red-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {memberDepartments.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-tag-gray-600 pt-2 border-t border-tag-gray-200">
          <CheckCircle className="h-4 w-4 text-tag-green-600" />
          <span className="font-medium">
            Assigned to {memberDepartments.length} department{memberDepartments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
