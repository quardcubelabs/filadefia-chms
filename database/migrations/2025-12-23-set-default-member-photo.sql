-- Migration: Set default member photo for members without a photo
-- Run this in Supabase SQL editor (or include in your migrations)
-- WARNING: Run on a backup or staging first if you're unsure.

BEGIN;

WITH updated AS (
  UPDATE public.members
  SET photo_url = 'https://cpkgyteugfjcgimykftj.supabase.co/storage/v1/object/public/member-photos/profile.png'
  WHERE photo_url IS NULL OR trim(photo_url) = ''
  RETURNING id
)
SELECT count(*) AS updated_count FROM updated;

COMMIT;
