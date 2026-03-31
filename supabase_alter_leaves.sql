-- Run this to update your database schema for the advanced Admin workflow
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT '';

