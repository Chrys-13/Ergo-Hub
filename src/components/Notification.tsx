import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-sm",
                n.type === 'success' && "bg-green-50/90 border-green-200 text-green-800",
                n.type === 'error' && "bg-red-50/90 border-red-200 text-red-800",
                n.type === 'info' && "bg-blue-50/90 border-blue-200 text-blue-800"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {n.type === 'success' && <CheckCircle2 size={18} />}
                {n.type === 'error' && <AlertCircle size={18} />}
                {n.type === 'info' && <Info size={18} />}
              </div>
              <p className="text-sm font-serif flex-1">{n.message}</p>
              <button 
                onClick={() => removeNotification(n.id)}
                className="shrink-0 text-current/40 hover:text-current transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
