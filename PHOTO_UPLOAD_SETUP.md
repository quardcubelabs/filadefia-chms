# Supabase Storage Setup for Member Photos

This guide explains how to set up Supabase Storage for member photo uploads in the FCC Church Management System.

## Overview

The application uses Supabase Storage to store member profile photos. The PhotoUpload component automatically creates and manages the storage bucket.

## Automatic Setup

The `PhotoUpload` component will automatically:
1. Create the `member-photos` bucket if it doesn't exist
2. Configure the bucket as public for easy access
3. Set file size limits (5MB max)
4. Restrict file types to images only (JPEG, PNG, WebP)

## Manual Setup (Optional)

If you prefer to set up the bucket manually in the Supabase Dashboard:

### Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `member-photos`
   - **Public**: ✅ Enable (allows public access to photos)
   - **File size limit**: 5242880 bytes (5MB)
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

### Step 2: Set Storage Policies (RLS)

The bucket should be publicly readable but only authenticated users can upload/delete.

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public can view member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');
```

#### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Authenticated Update
```sql
CREATE POLICY "Authenticated users can update member photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 4: Authenticated Delete
```sql
CREATE POLICY "Authenticated users can delete member photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-photos' 
  AND auth.role() = 'authenticated'
);
```

## File Naming Convention

Photos are automatically named using the pattern:
```
{member-id}-{timestamp}.{extension}
```

Example: `550e8400-e29b-41d4-a716-446655440000-1699372800000.jpg`

This ensures:
- Unique filenames (no collisions)
- Easy identification of member photos
- Automatic cleanup when updating photos

## File Requirements

- **Supported formats**: JPEG, JPG, PNG, WebP
- **Maximum size**: 5MB
- **Recommended dimensions**: Square image, at least 400x400 pixels
- **Aspect ratio**: 1:1 (square) for best results in circular avatars

## Storage URL Format

Once uploaded, photos are accessible via:
```
https://{project-ref}.supabase.co/storage/v1/object/public/member-photos/{filename}
```

## Database Integration

The `photo_url` field in the `members` table stores the full public URL:
```sql
-- members table
photo_url TEXT  -- Stores: https://...supabase.co/storage/v1/object/public/member-photos/...
```

## Usage in Application

### In Member Profile Page (`/members/[id]`)

The PhotoUpload component is integrated in the member profile:

```tsx
<PhotoUpload
  currentPhotoUrl={member.photo_url}
  memberName={`${member.first_name} ${member.last_name}`}
  memberId={member.id}
  supabase={supabase}
  onPhotoUploaded={(url) => {
    setMember(prev => prev ? { ...prev, photo_url: url } : null);
  }}
  onPhotoRemoved={() => {
    setMember(prev => prev ? { ...prev, photo_url: undefined } : null);
  }}
/>
```

### Features Available

1. **Upload Photo**: Click "Upload Photo" button to select and upload an image
2. **Change Photo**: Click "Change Photo" to replace existing photo (old photo is automatically deleted)
3. **Remove Photo**: Click "Remove" to delete the photo and fall back to avatar initials
4. **Preview**: Real-time preview of uploaded photo
5. **Validation**: Automatic validation of file type and size
6. **Error Handling**: User-friendly error messages for upload issues

## Fallback Behavior

If no photo is uploaded or the photo is removed:
- The Avatar component displays initials based on the member's name
- Example: "John Doe" → "JD"
- Uses TAG color scheme for background

## Storage Costs

Supabase Storage pricing (as of 2024):
- **Free tier**: 1GB storage + 2GB bandwidth/month
- **Pro tier**: 100GB storage + 200GB bandwidth/month
- Additional storage: ~$0.021/GB/month

Estimated usage for 1000 members:
- Average photo size: ~200KB
- Total storage: ~200MB (well within free tier)

## Troubleshooting

### Error: "Failed to create storage bucket"
- **Cause**: Insufficient permissions or Supabase service not properly configured
- **Solution**: Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

### Error: "Failed to upload photo"
- **Cause**: Network issues, file too large, or invalid file type
- **Solution**: 
  - Ensure file is under 5MB
  - Use JPEG, PNG, or WebP format
  - Check internet connection

### Photos not displaying
- **Cause**: Bucket not public or incorrect URL
- **Solution**: 
  - Verify bucket is set to public
  - Check RLS policies allow SELECT
  - Verify URL format in database

### Old photos not deleted
- **Cause**: Storage policy doesn't allow DELETE
- **Solution**: Check policy 4 above is applied

## Security Considerations

1. **Public Bucket**: The bucket is public to allow photos to display without authentication. This is standard for profile photos.

2. **Upload Restrictions**: Only authenticated users can upload, preventing spam.

3. **File Validation**: Client-side and server-side validation prevents malicious uploads.

4. **No Personal Data**: Photos should not contain sensitive information beyond appearance.

5. **GDPR Compliance**: Members should consent to photo storage. Add a checkbox in the member form if required.

## Future Enhancements

Potential improvements for production:

1. **Image Optimization**: 
   - Resize large images to standard dimensions
   - Convert to WebP for smaller file sizes
   - Generate thumbnails

2. **CDN Integration**: 
   - Use Supabase CDN for faster global delivery
   - Cache headers for better performance

3. **Facial Recognition**: 
   - Auto-detect faces for better cropping
   - Prevent duplicate member entries

4. **Bulk Upload**: 
   - Upload multiple photos via CSV import
   - Match photos by member number

5. **Photo Approval**: 
   - Require admin approval before photos go live
   - Review queue for inappropriate content

## Related Files

- `src/components/PhotoUpload.tsx` - Main photo upload component
- `src/app/members/[id]/page.tsx` - Member profile page with photo upload
- `src/components/ui/Avatar.tsx` - Avatar display component with fallback
- `database/schema.sql` - Members table with photo_url field

## Support

For issues with Supabase Storage:
- Supabase Docs: https://supabase.com/docs/guides/storage
- Storage API: https://supabase.com/docs/reference/javascript/storage
- Community: https://github.com/supabase/supabase/discussions
