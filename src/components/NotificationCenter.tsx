import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, MessageCircle, Megaphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const typeStyles: Record<string, { bg: string; icon: typeof Bell }> = {
  broadcast: { bg: 'bg-primary/5 border-primary/20', icon: Megaphone },
  reply: { bg: 'bg-emerald-500/5 border-emerald-500/20', icon: MessageCircle },
  sla_breach: { bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertCircle },
  system: { bg: 'bg-muted/40 border-muted', icon: Bell },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative"
        aria-label="התראות"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] z-50" dir="rtl">
            <Card className="border-2 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">התראות</CardTitle>
                    <CardDescription className="text-xs">
                      {unreadCount > 0
                        ? `${unreadCount} חדשות`
                        : 'הכל מעודכן'}
                    </CardDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead}>
                      <Check className="w-3 h-3 ml-1" /> סמן הכל
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[360px]">
                  {items.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">אין התראות עדיין</p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3">
                      {items.map((n) => {
                        const style = typeStyles[n.type] ?? typeStyles.system;
                        const Icon = style.icon;
                        const body = (
                          <div
                            className={cn(
                              'p-2.5 rounded-lg border flex items-start gap-2',
                              style.bg,
                              !n.read_at && 'ring-1 ring-primary/30',
                            )}
                          >
                            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {n.body}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(n.created_at).toLocaleString('he-IL')}
                              </p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {!n.read_at && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    markRead(n.id);
                                  }}
                                  aria-label="סמן כנקרא"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  remove(n.id);
                                }}
                                aria-label="מחק"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                        return n.link ? (
                          <Link
                            key={n.id}
                            to={n.link}
                            onClick={() => {
                              if (!n.read_at) markRead(n.id);
                              setOpen(false);
                            }}
                          >
                            {body}
                          </Link>
                        ) : (
                          <div key={n.id}>{body}</div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
