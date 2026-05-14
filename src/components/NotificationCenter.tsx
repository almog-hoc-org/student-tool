import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  listMyNotifications,
  markRead,
  markAllRead,
  deleteNotification as deleteNotificationApi,
  subscribeToNotifications,
  categoryLabel,
  type AppNotification,
} from '@/lib/notifications';

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      setNotifications(await listMyNotifications(user.id));
    } catch {
      /* silent: notification fetch failure must not break the app */
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    reload();
    const unsubscribe = subscribeToNotifications(user.id, n => {
      setNotifications(prev => [n, ...prev]);
    });
    return unsubscribe;
  }, [user, reload]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    try { await markRead(id); } catch { /* optimistic */ }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => (n.read_at ? n : { ...n, read_at: now })));
    try { await markAllRead(user.id); } catch { /* optimistic */ }
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await deleteNotificationApi(id); } catch { /* optimistic */ }
  };

  const handleClick = (n: AppNotification) => {
    if (!n.read_at) handleMarkRead(n.id);
    if (n.link) {
      setIsOpen(false);
      navigate(n.link);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="התראות"
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
                      onClick={handleMarkAllRead}
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
                      {notifications.map((n) => (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 rounded-lg border transition cursor-pointer ${
                            !n.read_at ? 'bg-primary/5 border-primary/30 border-2' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => handleClick(n)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{categoryLabel(n.category)}</Badge>
                                <p className="font-semibold text-sm truncate">{n.title}</p>
                              </div>
                              {n.body && (
                                <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{n.body}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(n.created_at).toLocaleString('he-IL')}
                              </p>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              {!n.read_at && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMarkRead(n.id)}
                                  aria-label="סמן כנקרא"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDelete(n.id)}
                                aria-label="מחק"
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
