# Supabase Integration Setup Guide

## Phase 1: Project Setup ✅ (Completed)

This phase sets up the foundation for integrating Supabase into SecureDoc.

### What Was Completed

1. ✅ **Installed Dependencies**
   - `@supabase/supabase-js` — Supabase client library
   - `@supabase/auth-helpers-react` — Auth helpers (note: deprecated but functional)
   - `tweetnacl` — Encryption library for document security

2. ✅ **Created Configuration Files**
   - `.env.example` — Template for environment variables (safe to commit)
   - `.env.local` — Local development config (git-ignored, DO NOT commit)
   - `.gitignore` — Ensures `.env.local` and secrets are not exposed

3. ✅ **Created Service Layer**
   - `src/services/supabaseClient.ts` — Supabase client initialization
   - `src/services/authService.ts` — Authentication operations (signup, signin, signout, password reset)
   - `src/services/requestService.ts` — Request CRUD operations
   - `src/services/documentService.ts` — Document upload/download with encryption
   - `src/services/auditService.ts` — Activity logging and audit trail

4. ✅ **Created Utilities**
   - `src/utils/errorHandler.ts` — Centralized error handling with user-friendly messages

5. ✅ **Created Database Schema**
   - `sql/schema.sql` — Database tables (users, requests, documents, activity_logs, etc.)
   - `sql/rls-policies.sql` — Row-Level Security policies for data access control

---

## Next Steps: Phase 2 - Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create account)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `secure-doc` (or preferred name)
   - **Database Password**: Create a strong password and save it securely
   - **Region**: Choose closest to your users (default: US-East)
4. Wait for project to initialize (2-5 minutes)
5. Once ready, note your project URL and anon key

### Step 2: Get API Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon Public Key** (long string starting with `eyJ...`)
3. Update `.env.local` with these values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...paste-your-key-here...
```

### Step 3: Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Make sure **Email** provider is enabled
3. (Optional) Enable OAuth providers (Google, GitHub, Microsoft) for future use

### Step 4: Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy the entire contents of `sql/schema.sql` from your project
4. Paste into the SQL editor
5. Click **"Run"** and wait for completion
6. Repeat for `sql/rls-policies.sql`

**Expected result**: No errors, 6 tables created with RLS enabled

### Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **"Create Bucket"**
3. Name: `documents`
4. Make it **Private** (not public)
5. Leave other settings as default
6. Click **Create**

### Step 6: Test Supabase Connection

Run the dev server and check if Supabase is connected:

```bash
npm run dev
```

Open browser console (F12) and verify:
- No errors about missing environment variables
- No connection errors to Supabase

---

## Phase 2 & 3: Integrate with React Components

After Supabase is set up, we'll update the React components to use the service layer:

### What Will Be Modified

1. **[src/app/context/AuthContext.tsx](../src/app/context/AuthContext.tsx)**
   - Replace mock auth with Supabase Auth
   - Use `authService.signIn()` and `authService.signOut()`
   - Listen for auth state changes with `authService.onAuthStateChange()`

2. **[src/app/context/DocumentContext.tsx](../src/app/context/DocumentContext.tsx)**
   - Replace hardcoded documents with `documentService.getDocumentsByRequestId()`
   - Use `documentService.uploadDocument()` for uploads

3. **[src/app/pages/NewRequest.tsx](../src/app/pages/NewRequest.tsx)**
   - Call `requestService.createRequest()` on form submit
   - Log activity with `auditService.logActivity()`

4. **[src/app/pages/RequestManagement.tsx](../src/app/pages/RequestManagement.tsx)**
   - Use `requestService.getAllRequests()` for admin view
   - Call `requestService.updateRequestStatus()` for approve/reject

5. **[src/app/pages/ActivityLogs.tsx](../src/app/pages/ActivityLogs.tsx)**
   - Replace hardcoded logs with `auditService.getActivityLogs(filters)`
   - Add real-time filtering

6. **[src/app/pages/Login.tsx](../src/app/pages/Login.tsx)**
   - Update for Supabase Auth flow
   - Handle email confirmation (if required)

---

## File Structure Overview

```
Secure-Doc/
├── .env.example                 # Template (safe to commit)
├── .env.local                   # Actual credentials (git-ignored)
├── .gitignore                   # Prevents .env.local from being committed
├── package.json                 # Updated with Supabase dependencies
│
├── sql/
│   ├── schema.sql               # Database schema (6 tables)
│   └── rls-policies.sql         # Row-Level Security policies
│
├── src/
│   ├── services/
│   │   ├── supabaseClient.ts    # Supabase client initialization
│   │   ├── authService.ts       # Auth operations
│   │   ├── requestService.ts    # Request CRUD
│   │   ├── documentService.ts   # Document upload/download
│   │   └── auditService.ts      # Activity logging
│   │
│   ├── utils/
│   │   └── errorHandler.ts      # Error handling & validation
│   │
│   └── app/
│       ├── context/
│       │   ├── AuthContext.tsx  # [TO UPDATE]
│       │   └── DocumentContext.tsx  # [TO UPDATE]
│       │
│       └── pages/
│           ├── Login.tsx        # [TO UPDATE]
│           ├── NewRequest.tsx   # [TO UPDATE]
│           ├── RequestManagement.tsx  # [TO UPDATE]
│           └── ActivityLogs.tsx # [TO UPDATE]
```

---

## Database Schema Overview

### Tables Created

1. **user_profiles** — User information (extends auth.users)
   - Stores: role (student/admin), full_name, department, email_verified

2. **requests** — Document requests from students
   - Stores: user_id, type, purpose, status (pending/approved/rejected), date

3. **documents** — Document metadata and file references
   - Stores: request_id, file_name, file_path, file_size, encrypted, uploaded_by, uploaded_at

4. **activity_logs** — Audit trail
   - Stores: user_id, action, resource, severity (info/warning/critical), ip_address, timestamp

5. **user_permissions** — Fine-grained permissions (optional, for future use)
   - Stores: user_id, permission, granted_by, revoked_at

6. **request_approvals** — Approval history
   - Stores: request_id, approved_by, status, remarks, timestamp

### Row-Level Security (RLS)

RLS is **enabled** on all tables. This means:
- Students can only access their own data
- Admins can access all data
- Audit logs are append-only (cannot be modified)
- **Access is enforced at database level** (not just application level)

---

## Important Notes

### Security

✅ **What's Secured**
- Supabase Auth manages password hashing and token generation
- RLS policies enforce access control at database level
- Environment variables kept out of version control
- File encryption enabled by default
- Audit logging captures all user actions

⚠️ **What Needs Attention**
- Document encryption key management (Phase 7)
- Password reset email flow (requires email service)
- Rate limiting (for login attempts)
- CORS configuration (if frontend hosted separately)

### Best Practices

1. **Never commit `.env.local`** — Contains sensitive API keys
2. **Test RLS policies thoroughly** — Data isolation is critical
3. **Monitor activity logs** — Track all user actions in admin dashboard
4. **Use soft deletes** — Data is marked deleted but retained for auditing
5. **Backup frequently** — Supabase provides backups, configure retention

### Troubleshooting

**Missing environment variables error?**
- Ensure `.env.local` file exists with correct keys
- Restart dev server after updating `.env.local`
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not empty

**Database schema already exists?**
- Supabase SQL Editor prevents duplicate table creation (safe to run again)
- If you want to reset, delete tables manually in SQL Editor

**RLS policies blocking access?**
- Temporarily disable RLS to test (not recommended for production)
- Check that user role is properly set in auth.users.user_metadata
- Review policy conditions in `rls-policies.sql`

---

## Next: Phase 2 Implementation

Ready to proceed? Next steps:

1. ✅ Create Supabase project and get API credentials
2. ✅ Run schema.sql and rls-policies.sql in SQL Editor
3. ✅ Create Storage bucket
4. ✅ Update `.env.local` with credentials
5. ⏭️ Update React components to use service layer (Phase 2-3)

**Estimated Time**: 30 minutes for setup, 2-3 hours for component integration.

---

## Questions?

Refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Service Layer Comments](../src/services/) — Detailed JSDoc comments
- [Error Handler Guide](../src/utils/errorHandler.ts) — Error handling examples
