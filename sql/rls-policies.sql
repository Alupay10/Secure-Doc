-- Row-Level Security (RLS) Policies for Secure-Doc
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- ==========================================
-- USER_PROFILES RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create profile during signup" ON public.user_profiles;

-- Students can read their own profile
CREATE POLICY "Students can read own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.user_profiles
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.user_profiles
FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Users can insert their profile on signup (via trigger, not direct)
CREATE POLICY "Users can create profile during signup"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ==========================================
-- REQUESTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students can read own requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON public.requests;
DROP POLICY IF EXISTS "Students can create requests" ON public.requests;
DROP POLICY IF EXISTS "Students can update own pending requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can update request status" ON public.requests;
DROP POLICY IF EXISTS "Students can delete own pending requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can delete any request" ON public.requests;

-- Students can read only their own requests
CREATE POLICY "Students can read own requests"
ON public.requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all requests
CREATE POLICY "Admins can read all requests"
ON public.requests
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Students can create requests
CREATE POLICY "Students can create requests"
ON public.requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can update their own pending requests
CREATE POLICY "Students can update own pending requests"
ON public.requests
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- Admins can update request status
CREATE POLICY "Admins can update request status"
ON public.requests
FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Students can delete their own requests
CREATE POLICY "Students can delete own pending requests"
ON public.requests
FOR DELETE
USING (
  auth.uid() = user_id
  AND status = 'pending'
);

-- Admins can delete any request
CREATE POLICY "Admins can delete any request"
ON public.requests
FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- DOCUMENTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students can read own approved documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can read all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can create documents" ON public.documents;
DROP POLICY IF EXISTS "Uploaders can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Students can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete any document" ON public.documents;

-- Students can read documents from their own approved requests only
CREATE POLICY "Students can read own approved documents"
ON public.documents
FOR SELECT
USING (
  (SELECT user_id FROM public.requests WHERE id = request_id) = auth.uid()
  AND (SELECT status FROM public.requests WHERE id = request_id) IN ('approved', 'pending')
);

-- Admins can read all documents
CREATE POLICY "Admins can read all documents"
ON public.documents
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Admins can create documents
CREATE POLICY "Admins can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Only the uploader or admins can update documents
CREATE POLICY "Uploaders can update own documents"
ON public.documents
FOR UPDATE
USING (
  auth.uid() = uploaded_by
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  auth.uid() = uploaded_by
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Students can delete documents from their own pending requests
CREATE POLICY "Students can delete own documents"
ON public.documents
FOR DELETE
USING (
  (SELECT user_id FROM public.requests WHERE id = request_id) = auth.uid()
  AND (SELECT status FROM public.requests WHERE id = request_id) = 'pending'
);

-- Admins can delete any document
CREATE POLICY "Admins can delete any document"
ON public.documents
FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- ACTIVITY_LOGS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students can read own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can read all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Activity logs cannot be modified" ON public.activity_logs;
DROP POLICY IF EXISTS "Activity logs cannot be deleted" ON public.activity_logs;

-- Students can read only their own activity logs
CREATE POLICY "Students can read own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all activity logs
CREATE POLICY "Admins can read all activity logs"
ON public.activity_logs
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Activity logs are append-only (no updates or deletes)
CREATE POLICY "Activity logs cannot be modified"
ON public.activity_logs
FOR UPDATE
USING (FALSE);

CREATE POLICY "Activity logs cannot be deleted"
ON public.activity_logs
FOR DELETE
USING (FALSE);

-- ==========================================
-- USER_PERMISSIONS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Users can read own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can read all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can grant permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can revoke permissions" ON public.user_permissions;

-- Users can read their own permissions
CREATE POLICY "Users can read own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all permissions
CREATE POLICY "Admins can read all permissions"
ON public.user_permissions
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Only admins can grant permissions
CREATE POLICY "Admins can grant permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Only admins can revoke permissions
CREATE POLICY "Admins can revoke permissions"
ON public.user_permissions
FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- REQUEST_APPROVALS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students can read approval history" ON public.request_approvals;
DROP POLICY IF EXISTS "Admins can read all approval history" ON public.request_approvals;
DROP POLICY IF EXISTS "Admins can create approval records" ON public.request_approvals;

-- Students can read approval history for their requests
CREATE POLICY "Students can read approval history"
ON public.request_approvals
FOR SELECT
USING (
  (SELECT user_id FROM public.requests WHERE id = request_id) = auth.uid()
);

-- Admins can read all approval history
CREATE POLICY "Admins can read all approval history"
ON public.request_approvals
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Only admins can create approval records
CREATE POLICY "Admins can create approval records"
ON public.request_approvals
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- STORAGE OBJECTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can read own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

CREATE POLICY "Admins can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Students can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1
    FROM public.requests r
    WHERE r.user_id = auth.uid()
      AND r.id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- NOTES:
-- ==========================================
-- 1. These policies enforce data access at the database level
-- 2. RLS denies access by default, then grants based on conditions
-- 3. Test each policy thoroughly before deploying to production
-- 4. Performance: Use indexes on foreign keys (done in schema.sql)
-- 5. Soft deletes: is_deleted_at IS NULL filters are implicit in most queries
