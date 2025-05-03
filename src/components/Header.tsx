import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PaperPlaneRight } from '@phosphor-icons/react';

export default function Header() {
  const { isLoginOpen, setIsLoginOpen } = useAuth();

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Mi Aplicación</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleLoginClick}
          >
            <PaperPlaneRight size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}