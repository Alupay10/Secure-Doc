-- Secure-Doc Database Schema
-- Run this in Supabase SQL Editor to set up the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. USERS TABLE (extends auth.users)
-- ==========================================
-- Note: User authentication is handled by Supabase Auth
-- This table stores additional user profile information

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'student' NOT NULL CHECK (role IN ('student', 'admin')),
  full_name VARCHAR(255),
  department VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. REQUESTS TABLE
-- ==========================================
-- Stores document requests from students

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  type VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  remarks TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS requests_user_id_idx ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_date_idx ON public.requests(date DESC);
CREATE INDEX IF NOT EXISTS requests_deleted_at_idx ON public.requests(deleted_at);

-- ==========================================
-- 3. DOCUMENTS TABLE
-- ==========================================
-- Stores document metadata and references to files in storage

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_path VARCHAR(500) NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  encryption_key VARCHAR(500),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS documents_request_id_idx ON public.documents(request_id);
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS documents_uploaded_at_idx ON public.documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS documents_deleted_at_idx ON public.documents(deleted_at);

-- ==========================================
-- 4. ACTIVITY_LOGS TABLE
-- ==========================================
-- Audit trail for all user actions

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  details JSONB,
  severity VARCHAR(20) DEFAULT 'info' NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries and performance
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_severity_idx ON public.activity_logs(severity);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at DESC);

-- ==========================================
-- 5. USER_PERMISSIONS TABLE
-- ==========================================
-- Fine-grained permissions for admins

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(255) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, permission)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_permissions_user_id_idx ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS user_permissions_permission_idx ON public.user_permissions(permission);

-- ==========================================
-- 6. REQUEST_APPROVALS TABLE
-- ==========================================
-- Track approval history for each request

CREATE TABLE IF NOT EXISTS public.request_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'rejected')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS request_approvals_request_id_idx ON public.request_approvals(request_id);
CREATE INDEX IF NOT EXISTS request_approvals_approved_by_idx ON public.request_approvals(approved_by);

-- ==========================================
-- 7. ENABLE ROW-LEVEL SECURITY
-- ==========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- NOTES:
-- ==========================================
-- 1. Row-Level Security (RLS) policies are defined in rls-policies.sql
-- 2. Supabase Storage bucket 'documents' must be created separately in Supabase dashboard
-- 3. All tables use soft deletes (deleted_at column) for audit compliance
-- 4. Auth is handled by Supabase Auth (auth.users table)
-- 5. User metadata (role) is stored in auth.users.user_metadata for real-time access
