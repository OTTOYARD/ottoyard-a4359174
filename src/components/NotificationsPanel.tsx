import React from 'react';
import { Bell, BellOff, Volume2, VolumeX, Check, Trash2, Battery, Wrench, Zap, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'low_battery':
      return <Battery className="h-4 w-4" />;
    case 'maintenance_due':
      return <Wrench className="h-4 w-4" />;
    case 'charging_complete':
      return <Zap className="h-4 w-4" />;
    case 'critical_alert':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getSeverityStyles = (severity: 'info' | 'warning' | 'critical', read: boolean) => {
  const baseOpacity = read ? 'opacity-60' : '';
  
  switch (severity) {
    case 'critical':
      return cn('border-l-4 border-l-destructive bg-destructive/10', baseOpacity);
    case 'warning':
      return cn('border-l-4 border-l-warning bg-warning/10', baseOpacity);
    default:
      return cn('border-l-4 border-l-success bg-success/10', baseOpacity);
  }
};

const getSeverityIconColor = (severity: 'info' | 'warning' | 'critical') => {
  switch (severity) {
    case 'critical':
      return 'text-destructive';
    case 'warning':
      return 'text-warning';
    default:
      return 'text-success';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  return (
    <div
      className={cn(
        'p-3 rounded-lg transition-all duration-200 hover:bg-muted/50 cursor-pointer relative group',
        getSeverityStyles(notification.severity, notification.read),
        !notification.read && 'animate-pulse-once'
      )}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-full bg-background/50',
          getSeverityIconColor(notification.severity)
        )}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              'text-sm font-semibold truncate',
              notification.read ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            )}
          </div>
          
          <p className={cn(
            'text-xs mt-1 line-clamp-2',
            notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'
          )}>
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            {notification.vehiclePlate && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {notification.vehiclePlate}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover action */}
      {!notification.read && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
        >
          <Check className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export const NotificationsPanel: React.FC = () => {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-primary/10"
        >
          {soundEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-bounce-subtle">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 border-border/50 bg-card/95 backdrop-blur-xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={clearNotifications}
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border/50 bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</span>
              <Badge 
                className={cn(
                  "text-[10px] px-2 py-0.5",
                  unreadCount === 0 
                    ? "bg-success/20 text-success border-success/30" 
                    : "bg-warning/20 text-warning border-warning/30"
                )}
                variant="outline"
              >
                {unreadCount === 0 ? 'All read' : `${unreadCount} unread`}
              </Badge>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
