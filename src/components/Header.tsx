import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignIn, SignOut } from '@phosphor-icons/react';

export default function Header() {
  const { isLoginOpen, setIsLoginOpen, user, signOut } = useAuth();

  const handleAuthClick = async () => {
    if (user) {
      try {
        await signOut();
        setIsLoginOpen(false);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/100 border-b border-border/40 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 bg-background/100">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Mi Aplicación</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="px-4 py-2 rounded-md flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 active:transform active:scale-95"
            onClick={handleAuthClick}
            onKeyDown={(e) => e.key === 'Enter' && handleAuthClick()}
          >
            {user ? (
              <>
                <SignOut size={16} />
                <span>Cerrar sesión</span>
              </>
            ) : (
              <>
                <SignIn size={16} />
                <span>Iniciar sesión</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}