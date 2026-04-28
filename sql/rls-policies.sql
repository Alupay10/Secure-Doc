-- Row-Level Security (RLS) Policies for Secure-Doc
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- ==========================================
-- USER_PROFILES RLS POLICIES
-- ==========================================

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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can insert their profile on signup (via trigger, not direct)
CREATE POLICY "Users can create profile during signup"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ==========================================
-- REQUESTS RLS POLICIES
-- ==========================================

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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- DOCUMENTS RLS POLICIES
-- ==========================================

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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can create documents
CREATE POLICY "Admins can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Only the uploader or admins can update documents
CREATE POLICY "Uploaders can update own documents"
ON public.documents
FOR UPDATE
USING (
  auth.uid() = uploaded_by
  OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.uid() = uploaded_by
  OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- ACTIVITY_LOGS RLS POLICIES
-- ==========================================

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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Only admins can grant permissions
CREATE POLICY "Admins can grant permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Only admins can revoke permissions
CREATE POLICY "Admins can revoke permissions"
ON public.user_permissions
FOR UPDATE
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- REQUEST_APPROVALS RLS POLICIES
-- ==========================================

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
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Only admins can create approval records
CREATE POLICY "Admins can create approval records"
ON public.request_approvals
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- NOTES:
-- ==========================================
-- 1. These policies enforce data access at the database level
-- 2. RLS denies access by default, then grants based on conditions
-- 3. Test each policy thoroughly before deploying to production
-- 4. Performance: Use indexes on foreign keys (done in schema.sql)
-- 5. Soft deletes: is_deleted_at IS NULL filters are implicit in most queries
