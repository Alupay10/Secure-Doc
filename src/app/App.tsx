import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <RouterProvider router={router} />
        <Toaster />
      </DocumentProvider>
    </AuthProvider>
  );
}