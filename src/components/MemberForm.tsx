'use client';

import { useState, useEffect } from 'react';
import { Button, Input, TextArea, Select } from '@/components/ui';
import { User, Phone, Mail, MapPin, Calendar, Briefcase, Users as UsersIcon, Upload, Building2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Department {
  id: string;
  name: string;
  swahili_name?: string;
}

interface MemberFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: 'male' | 'female' | '';
  date_of_birth: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | '';
  phone: string;
  email: string;
  address: string;
  occupation: string;
  employer: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  baptism_date: string;
  membership_date: string;
  status: 'active' | 'visitor' | 'transferred' | 'inactive';
  notes: string;
  photo_url: string;
  department_ids: string[];
}

interface MemberFormProps {
  initialData?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export default function MemberForm({ initialData, onSubmit, onCancel, isEditing = false, loading = false }: MemberFormProps) {
  const { supabase } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    middle_name: initialData?.middle_name || '',
    gender: initialData?.gender || '',
    date_of_birth: initialData?.date_of_birth || '',
    marital_status: initialData?.marital_status || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    occupation: initialData?.occupation || '',
    employer: initialData?.employer || '',
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    baptism_date: initialData?.baptism_date || '',
    membership_date: initialData?.membership_date || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
    photo_url: initialData?.photo_url || '',
    department_ids: initialData?.department_ids || [],
  });

  const [uploading, setUploading] = useState(false);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, swahili_name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDepartment = () => {
    if (!selectedDepartmentId) return;
    
    // Check if department is already added
    if (formData.department_ids.includes(selectedDepartmentId)) {
      alert('This department is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      department_ids: [...prev.department_ids, selectedDepartmentId]
    }));
    setSelectedDepartmentId('');
  };

  const handleRemoveDepartment = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids.filter(id => id !== departmentId)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // TODO: Implement Supabase Storage upload
      // For now, just use a placeholder URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Photo Upload */}
      <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-fcc-blue-500 to-fcc-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden flex-shrink-0">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Member" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 sm:h-12 sm:w-12" />
          )}
        </div>
        <div className="text-center sm:text-left">
          <label className="block">
            <span className="sr-only">Choose photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-sm text-gray-500
                file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4
                file:rounded-lg file:border-0
                file:text-xs sm:file:text-sm file:font-semibold
                file:bg-fcc-blue-50 file:text-fcc-blue-700
                hover:file:bg-fcc-blue-100
                cursor-pointer"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-fcc-blue-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="Middle Name"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            fullWidth
          />
          <Input
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            fullWidth
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select Gender' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]}
            required
            fullWidth
          />
          <Input
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
            fullWidth
            icon={<Calendar className="h-5 w-5" />}
          />
          <Select
            label="Marital Status"
            name="marital_status"
            value={formData.marital_status}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select Status' },
              { value: 'single', label: 'Single' },
              { value: 'married', label: 'Married' },
              { value: 'divorced', label: 'Divorced' },
              { value: 'widowed', label: 'Widowed' }
            ]}
            required
            fullWidth
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-fcc-blue-600" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+255 712 345 678"
            required
            fullWidth
            icon={<Phone className="h-5 w-5" />}
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="member@example.com"
            fullWidth
            icon={<Mail className="h-5 w-5" />}
          />
        </div>

        <div className="mt-3 sm:mt-4">
          <TextArea
            label="Physical Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street, Ward, District, Region"
            rows={2}
            required
            fullWidth
          />
        </div>
      </div>

      {/* Employment Information */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-fcc-blue-600" />
          Employment Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="e.g., Teacher, Engineer"
            fullWidth
          />
          <Input
            label="Employer"
            name="employer"
            value={formData.employer}
            onChange={handleChange}
            placeholder="Company/Organization name"
            fullWidth
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-fcc-blue-600" />
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Contact Name"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
            placeholder="Full name"
            required
            fullWidth
          />
          <Input
            label="Contact Phone"
            name="emergency_contact_phone"
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
            placeholder="+255 712 345 678"
            required
            fullWidth
            icon={<Phone className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Membership Information */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-fcc-blue-600" />
          Membership Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="Baptism Date"
            name="baptism_date"
            type="date"
            value={formData.baptism_date}
            onChange={handleChange}
            fullWidth
            helperText="Leave blank if not baptized"
          />
          <Input
            label="Membership Date"
            name="membership_date"
            type="date"
            value={formData.membership_date}
            onChange={handleChange}
            required
            fullWidth
          />
          <Select
            label="Member Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'active', label: 'Active Member' },
              { value: 'visitor', label: 'Visitor' },
              { value: 'transferred', label: 'Transferred' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            required
            fullWidth
          />
        </div>
      </div>

      {/* Department Assignment */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          Department Assignment
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Department Selection */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <Select
                label="Select Department"
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                options={[
                  { value: '', label: 'Choose a department...' },
                  ...departments.map(dept => ({
                    value: dept.id,
                    label: dept.swahili_name ? `${dept.name} (${dept.swahili_name})` : dept.name
                  }))
                ]}
                disabled={loadingDepartments}
                fullWidth
              />
            </div>
            <div className="flex items-end sm:mt-0 mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDepartment}
                disabled={!selectedDepartmentId || loadingDepartments}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Selected Departments List */}
          {formData.department_ids.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Assigned Departments ({formData.department_ids.length})
              </p>
              <div className="space-y-2">
                {formData.department_ids.map(deptId => {
                  const dept = departments.find(d => d.id === deptId);
                  if (!dept) return null;
                  
                  return (
                    <div
                      key={deptId}
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                          {dept.swahili_name && (
                            <p className="text-xs text-gray-500">{dept.swahili_name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(deptId)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {formData.department_ids.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No departments assigned yet. Members can be assigned to multiple departments.
            </p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <TextArea
          label="Additional Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional information about the member..."
          rows={3}
          fullWidth
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={uploading}
        >
          {isEditing ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}
