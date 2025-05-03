import { ModalProvider } from "@/providers/ModalProvider";
import { TooltipProvider } from "@/providers/TooltipProvider";
import { AuthProvider } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ModalProvider>{children}</ModalProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
