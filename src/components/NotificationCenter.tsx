import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

const STORAGE_KEY = 'calculator-notifications';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const typeColors = {
    info: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute left-0 mt-2 w-96 z-50"
          >
            <Card className="border-2 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">התראות</CardTitle>
                    <CardDescription>
                      {unreadCount > 0 ? `${unreadCount} התראות חדשות` : 'אין התראות חדשות'}
                    </CardDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <Check className="h-4 w-4 ml-2" />
                      סמן הכל כנקרא
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>אין התראות</p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 rounded-lg border ${typeColors[notification.type]} ${
                            !notification.read ? 'border-2' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm mb-1 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.timestamp.toLocaleString('he-IL')}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications: Notification[] = stored ? JSON.parse(stored) : [];
  
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false,
  };
  
  const updated = [newNotification, ...notifications].slice(0, 50); // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Trigger custom event to update UI
  window.dispatchEvent(new CustomEvent('notification-added'));
}
