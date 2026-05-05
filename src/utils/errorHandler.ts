import { toast } from 'sonner';

type ErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
};

/**
 * Supabase error codes and their user-friendly messages
 */
const errorMessageMap: Record<string, string> = {
  'auth-invalid-credentials': 'Invalid email or password',
  'auth-user-not-found': 'User not found',
  'auth-user-already-exists': 'User with this email already exists',
  'auth-weak-password': 'Password is too weak (minimum 6 characters)',
  'auth-email-not-confirmed': 'Please confirm your email before logging in',
  'auth-session-not-found': 'Session expired, please log in again',
  'auth-invalid-jwt': 'Invalid session, please log in again',
  'auth-jwt-expired': 'Session expired, please log in again',
  'rate-limit': 'Too many requests, please try again later',
  'permission-denied': 'You do not have permission to access this resource',
  'database-error': 'Database error, please try again',
  'storage-error': 'File upload error, please try again',
  'network-error': 'Network error, please check your connection',
  'pgrst116': 'The requested record was not found',
  '23503': 'This item is still in use and cannot be changed',
  '23505': 'A record with the same value already exists',
  '42501': 'You do not have permission to do that',
  '42p01': 'A required database table is missing',
  '22p02': 'One of the supplied values is invalid',
  '404': 'The requested resource was not found',
  '413': 'The file or payload is too large',
};

/**
 * Parse Supabase error and return user-friendly message
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for specific error codes
    for (const [code, userMsg] of Object.entries(errorMessageMap)) {
      if (message.includes(code) || message.includes(code.replace('-', ' '))) {
        return userMsg;
      }
    }

    // Check for common patterns
    if (message.includes('invalid login credentials')) {
      return errorMessageMap['auth-invalid-credentials'];
    }
    if (message.includes('user already registered')) {
      return errorMessageMap['auth-user-already-exists'];
    }
    if (message.includes('weak password')) {
      return errorMessageMap['auth-weak-password'];
    }
    if (message.includes('access denied') || message.includes('permission denied')) {
      return errorMessageMap['permission-denied'];
    }
    if (message.includes('network') || message.includes('offline')) {
      return errorMessageMap['network-error'];
    }
    if (message.includes('rate limit')) {
      return errorMessageMap['rate-limit'];
    }

    // Default to original error message
    return error.message;
  }

  if (error && typeof error === 'object') {
    const typedError = error as ErrorLike;
    const message = String(typedError.message || '').toLowerCase();
    const code = String(typedError.code || '').toLowerCase();
    const status = String(typedError.status || '').toLowerCase();

    const lookup = [code, status, message].filter(Boolean);

    for (const candidate of lookup) {
      for (const [key, userMsg] of Object.entries(errorMessageMap)) {
        if (candidate.includes(key) || candidate.includes(key.replace('-', ' '))) {
          return userMsg;
        }
      }
    }

    if (message.includes('new row violates row-level security policy')) {
      return errorMessageMap['42501'];
    }
    if (message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist')) {
      return errorMessageMap['42p01'];
    }
    if (message.includes('no rows found')) {
      return errorMessageMap['pgrst116'];
    }
    if (message.includes('foreign key')) {
      return errorMessageMap['23503'];
    }
    if (message.includes('duplicate key') || message.includes('unique constraint')) {
      return errorMessageMap['23505'];
    }
    if (message.includes('invalid input syntax')) {
      return errorMessageMap['22p02'];
    }
    if (message.includes('payload too large')) {
      return errorMessageMap['413'];
    }

    if (message || typedError.details || typedError.hint) {
      return [typedError.message, typedError.details, typedError.hint]
        .filter(Boolean)
        .map(String)
        .join(' - ');
    }
  }

  return 'An unexpected error occurred';
};

/**
 * Handle Supabase errors with logging and user feedback
 * @param error The error object
 * @param context Context for error logging (e.g., 'auth', 'upload', 'fetch')
 * @param showToast Whether to show toast notification (default: true)
 */
export const handleError = (
  error: unknown,
  context: string = 'general',
  showToast: boolean = true
): string => {
  const userMessage = getErrorMessage(error);

  // Log error in development
  if (import.meta.env.DEV) {
    console.error(`[${context}] Error:`, error);
  }

  // Show toast notification to user
  if (showToast) {
    toast.error(userMessage, {
      description: `Error occurred in ${context}`,
      duration: 5000,
    });
  }

  return userMessage;
};

/**
 * Handle success with optional toast notification
 */
export const handleSuccess = (
  message: string,
  description?: string
): void => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength (minimum 6 characters)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate request form submission fields
 */
export const validateRequestForm = (
  documentType: string,
  purpose: string
): { valid: boolean; error?: string } => {
  if (!documentType.trim()) {
    return { valid: false, error: 'Please select a document type' };
  }

  if (!purpose.trim()) {
    return { valid: false, error: 'Please provide a purpose for your request' };
  }

  if (purpose.trim().length < 6) {
    return { valid: false, error: 'Purpose must be at least 6 characters long' };
  }

  return { valid: true };
};

/**
 * Validate file upload
 */
export const validateFile = (
  file: File,
  maxSizeMB: number = 100,
  allowedTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ]
): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
};
