'use client';

import { useState, useRef } from 'react';
import { Button, Avatar, Alert } from '@/components/ui';
import { Upload, Camera, X, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  memberName: string;
  memberId: string;
  supabase: any;
  onPhotoUploaded?: (url: string) => void;
  onPhotoRemoved?: () => void;
  className?: string;
}

const BUCKET_NAME = 'member-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PhotoUpload({
  currentPhotoUrl,
  memberName,
  memberId,
  supabase,
  onPhotoUploaded,
  onPhotoRemoved,
  className = '',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b: any) => b.name === BUCKET_NAME);

      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_TYPES,
        });

        if (bucketError) {
          console.error('Bucket creation error:', bucketError);
          throw new Error('Failed to create storage bucket. Please contact administrator.');
        }
      }

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      }

      // Upload new photo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update member record
      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: publicUrl })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      
      if (onPhotoUploaded) {
        onPhotoUploaded(publicUrl);
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this photo?')) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Delete from storage
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      }

      // Update member record
      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: null })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      
      if (onPhotoRemoved) {
        onPhotoRemoved();
      }

    } catch (err: any) {
      console.error('Remove error:', err);
      setError(err.message || 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Photo Preview and Controls */}
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Preview */}
        <div className="relative">
          <Avatar
            src={previewUrl || undefined}
            alt={memberName}
            size="xl"
            className="border-4 border-white shadow-xl ring-2 ring-tag-gray-200"
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload/Remove Buttons */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>

          {previewUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemovePhoto}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-tag-gray-500 text-center max-w-xs">
          Upload a photo (JPEG, PNG, or WebP). Maximum file size: 5MB.
          <br />
          Recommended: Square image, at least 400x400 pixels.
        </p>
      </div>
    </div>
  );
}
