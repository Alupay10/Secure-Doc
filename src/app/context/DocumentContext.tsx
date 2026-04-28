import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as documentService from '../../services/documentService';
import { useAuth } from './AuthContext';
import { handleError, validateFile } from '../../utils/errorHandler';

interface UploadedDocument {
  id?: string;
  requestId: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  remarks?: string;
  encrypted: boolean;
}

interface DocumentContextType {
  uploadedDocuments: UploadedDocument[];
  uploadDocument: (requestId: string, file: File, remarks?: string) => Promise<void>;
  getDocumentByRequestId: (requestId: string) => UploadedDocument | undefined;
  fetchDocumentsForRequest: (requestId: string) => Promise<UploadedDocument[]>;
  refreshForRequest: (requestId: string) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Optionally preload documents for the current user
    // We'll not load everything at once; components can call getDocumentByRequestId
  }, [user]);

  const uploadDocument = useCallback(async (requestId: string, file: File, remarks?: string) => {
    try {
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) throw new Error(fileValidation.error);

      if (!user) throw new Error('Not authenticated');

      const doc = await documentService.uploadDocument(requestId, file, user.id, remarks);
      setUploadedDocuments((prev) => [doc as any, ...prev]);
    } catch (err) {
      handleError(err, 'documents:upload');
      throw err;
    }
  }, [user]);

  const getDocumentByRequestId = useCallback((requestId: string) => {
    return uploadedDocuments.find((doc) => doc.requestId === requestId);
  }, [uploadedDocuments]);

  const fetchDocumentsForRequest = useCallback(async (requestId: string) => {
    try {
      const docs = await documentService.getDocumentsByRequestId(requestId);
      // normalize shape
      const mapped = (docs || []).map((d: any) => ({
        id: d.id,
        requestId: d.request_id,
        fileName: d.file_name,
        fileType: d.file_type,
        uploadedBy: d.uploaded_by,
        uploadedAt: d.uploaded_at,
        remarks: d.remarks,
        encrypted: d.encrypted,
      }));
      // merge into local cache
      setUploadedDocuments((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const merged = [...mapped, ...prev.filter((p) => !ids.has(p.id))];
        return merged;
      });
      return mapped;
    } catch (err) {
      handleError(err, 'documents:fetch', false);
      return [];
    }
  }, []);

  const refreshForRequest = useCallback(async (requestId: string) => {
    await fetchDocumentsForRequest(requestId);
  }, [fetchDocumentsForRequest]);

  const contextValue = useMemo(() => ({
    uploadedDocuments,
    uploadDocument,
    getDocumentByRequestId,
    fetchDocumentsForRequest,
    refreshForRequest,
  }), [uploadedDocuments, uploadDocument, getDocumentByRequestId, fetchDocumentsForRequest, refreshForRequest]);

  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
