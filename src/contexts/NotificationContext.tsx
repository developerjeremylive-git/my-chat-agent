import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '@/components/ui/Notification';
import type { NotificationType } from '@/components/ui/Notification';

interface NotificationData {
  id: string;
  message: string;
  duration?: number;
  type?: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, duration?: number, type?: NotificationType) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showDeletion: (message: string, duration?: number) => void;
  showTitleUpdate: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (message: string, duration = 5000, type: NotificationType = 'info') => {
    const id = uuidv4();
    setNotifications((prev) => [...prev, { id, message, duration, type }]);
  };

  const showSuccess = (message: string, duration = 3000) => 
    showNotification(message, duration, 'success');
    
  const showError = (message: string, duration = 5000) => 
    showNotification(message, duration, 'error');
    
  const showInfo = (message: string, duration = 4000) => 
    showNotification(message, duration, 'info');
    
  const showWarning = (message: string, duration = 4000) => 
    showNotification(message, duration, 'warning');
    
  const showDeletion = (message: string, duration = 5000) => 
    showNotification(message, duration, 'deletion');
    
  const showTitleUpdate = (message: string, duration = 3000) =>
    showNotification(message, duration, 'titleUpdate');

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      showDeletion,
      showTitleUpdate
    }}>
      {children}
      <div className="fixed top-0 right-0 z-50 flex flex-col space-y-2 p-4">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            duration={notification.duration}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
