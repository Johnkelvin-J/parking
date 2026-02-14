import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/services/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Loader2, MapPin, Clock, Trophy, Car } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const notificationIcons = {
  spot_found: MapPin,
  time_expiring: Clock,
  reward_earned: Trophy,
  spot_taken: Car,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return getUserNotifications(user.id, 50);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await markAllNotificationsAsRead(user.id);
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) return;
      await deleteNotification(notificationId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            Stay updated on parking spots and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${!notification.read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(notification.timestamp, 'PPp')}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markReadMutation.mutate(notification.id)}
                            disabled={markReadMutation.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this notification?')) {
                              deleteMutation.mutate(notification.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm mt-2">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

