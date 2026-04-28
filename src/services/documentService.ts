import { supabase } from './supabaseClient';
import { decryptBlob, decodeEncryptionMetadata, encryptFile, encodeEncryptionMetadata } from '../utils/encryption';

export interface Document {
  id: string;
  request_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  encrypted: boolean;
  encryption_key?: string;
  uploaded_by: string;
  uploaded_at: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_BUCKET = 'documents';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Upload document to Supabase Storage and create metadata entry
 */
export const uploadDocument = async (
  requestId: string,
  file: File,
  userId: string,
  remarks?: string
): Promise<Document> => {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const fileName = `${requestId}/${timestamp}_${file.name}`;

  const encryptedPayload = await encryptFile(file);

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, encryptedPayload.blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create document metadata in database
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([
      {
        request_id: requestId,
        file_name: file.name,
        file_type: file.type,
        file_path: fileName,
        file_size: file.size,
        encrypted: true, // Always encrypt documents
        encryption_key: encodeEncryptionMetadata(encryptedPayload.metadata),
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        remarks: remarks || null,
      },
    ])
    .select()
    .single();

  if (dbError) {
    // Delete file if database insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
    throw dbError;
  }

  if (!data) throw new Error('Failed to create document metadata');

  return data as Document;
};

/**
 * Get documents for a request
 */
export const getDocumentsByRequestId = async (requestId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('request_id', requestId)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Document[];
};

/**
 * Get document by ID
 */
export const getDocumentById = async (documentId: string): Promise<Document> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Document not found');

  return data as Document;
};

/**
 * Get signed download URL for a document (valid for 1 hour)
 */
export const getDocumentDownloadUrl = async (
  documentId: string,
  expiresIn: number = 3600
): Promise<string> => {
  const document = await getDocumentById(documentId);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(document.file_path, expiresIn);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error('Failed to generate download URL');

  return data.signedUrl;
};

/**
 * Download document file
 */
export const downloadDocument = async (documentId: string): Promise<Blob> => {
  const document = await getDocumentById(documentId);
  const metadata = decodeEncryptionMetadata(document.encryption_key);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(document.file_path);

  if (error) throw error;
  if (!data) throw new Error('Failed to download document');

  if (!metadata) {
    throw new Error('Missing encryption metadata for document');
  }

  return decryptBlob(data, metadata);
};

/**
 * Delete document (soft delete)
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId);

  if (error) throw error;
};

/**
 * Permanently delete document from storage (hard delete - use with caution)
 */
export const permanentlyDeleteDocument = async (documentId: string): Promise<void> => {
  const document = await getDocumentById(documentId);

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([document.file_path]);

  if (storageError) throw storageError;

  // Hard delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) throw dbError;
};

/**
 * Get all documents (admin only)
 */
export const getAllDocuments = async (
  filters?: {
    limit?: number;
    offset?: number;
  }
): Promise<Document[]> => {
  let query = supabase
    .from('documents')
    .select('*')
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Document[];
};

/**
 * Get document statistics (for dashboard)
 */
export const getDocumentStats = async () => {
  const { data, error } = await supabase
    .from('documents')
    .select('file_size, file_type')
    .is('deleted_at', null);

  if (error) throw error;

  const stats = {
    totalDocuments: data?.length || 0,
    totalSize: (data || []).reduce((sum, doc) => sum + (doc.file_size || 0), 0),
    byType: {} as Record<string, number>,
  };

  // Group by file type
  (data || []).forEach((doc) => {
    stats.byType[doc.file_type] = (stats.byType[doc.file_type] || 0) + 1;
  });

  return stats;
};
