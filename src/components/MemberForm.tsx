'use client';

import { useState } from 'react';
import { Button, Input, TextArea, Select } from '@/components/ui';
import { User, Phone, Mail, MapPin, Calendar, Briefcase, Users as UsersIcon, Upload } from 'lucide-react';

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
}

interface MemberFormProps {
  initialData?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export default function MemberForm({ initialData, onSubmit, onCancel, isEditing = false, loading = false }: MemberFormProps) {
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
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="flex items-center space-x-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-fcc-blue-500 to-fcc-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Member" className="h-full w-full object-cover" />
          ) : (
            <User className="h-12 w-12" />
          )}
        </div>
        <div>
          <label className="block">
            <span className="sr-only">Choose photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-fcc-blue-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-fcc-blue-600" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="mt-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-fcc-blue-600" />
          Employment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UsersIcon className="h-5 w-5 mr-2 text-fcc-blue-600" />
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-fcc-blue-600" />
          Membership Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
