import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadedDocument {
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
  uploadDocument: (doc: UploadedDocument) => void;
  getDocumentByRequestId: (requestId: string) => UploadedDocument | undefined;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([
    {
      requestId: '1247',
      fileName: 'official_transcript_john_doe.pdf',
      fileType: 'application/pdf',
      uploadedBy: 'Admin User',
      uploadedAt: '2026-04-26 15:30:00',
      encrypted: true,
    },
    {
      requestId: '1240',
      fileName: 'recommendation_letter.pdf',
      fileType: 'application/pdf',
      uploadedBy: 'Admin User',
      uploadedAt: '2026-04-25 14:20:00',
      encrypted: true,
    },
  ]);

  const uploadDocument = (doc: UploadedDocument) => {
    setUploadedDocuments([...uploadedDocuments, doc]);
  };

  const getDocumentByRequestId = (requestId: string) => {
    return uploadedDocuments.find(doc => doc.requestId === requestId);
  };

  return (
    <DocumentContext.Provider value={{ uploadedDocuments, uploadDocument, getDocumentByRequestId }}>
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
