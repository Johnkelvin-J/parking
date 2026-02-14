import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserSessionHistory,
  getActiveSessionForUser,
  endParkingSession,
  setSessionReminder,
  cancelSessionReminder,
} from '@/services/parkingSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ParkingSessionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activeSession, isLoading: activeLoading } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => {
      if (!user?.id) return null;
      return getActiveSessionForUser(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessionHistory', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return getUserSessionHistory(user.id, 20);
    },
    enabled: !!user?.id,
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => endParkingSession(sessionId),
    onSuccess: () => {
      toast.success('Parking session ended');
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['sessionHistory'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to end session');
    },
  });

  const reminderMutation = useMutation({
    mutationFn: ({ sessionId, reminderTime }: { sessionId: string; reminderTime: Date }) =>
      setSessionReminder(sessionId, reminderTime),
    onSuccess: () => {
      toast.success('Reminder set');
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set reminder');
    },
  });

  const cancelReminderMutation = useMutation({
    mutationFn: (sessionId: string) => cancelSessionReminder(sessionId),
    onSuccess: () => {
      toast.success('Reminder cancelled');
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel reminder');
    },
  });

  if (activeLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parking Sessions</h1>
        <p className="text-muted-foreground mt-1">
          Manage your active and past parking sessions
        </p>
      </div>

      {activeSession && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Session
                </CardTitle>
                <CardDescription>
                  Started {formatDistanceToNow(activeSession.startTime, { addSuffix: true })}
                </CardDescription>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="font-medium">{format(activeSession.startTime, 'PPp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {formatDistanceToNow(activeSession.startTime, { includeSeconds: false })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <SetReminderDialog
                  sessionId={activeSession.id}
                  hasReminder={activeSession.reminderSet}
                  onSetReminder={(time) =>
                    reminderMutation.mutate({ sessionId: activeSession.id, reminderTime: time })
                  }
                  onCancelReminder={() => cancelReminderMutation.mutate(activeSession.id)}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('End this parking session?')) {
                      endSessionMutation.mutate(activeSession.id);
                    }
                  }}
                  disabled={endSessionMutation.isPending}
                >
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeSession && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No active parking session</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Session History</h2>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(session.startTime, 'PPp')}
                    </CardTitle>
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Active' : 'Ended'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {session.endTime
                      ? `Ended ${formatDistanceToNow(session.endTime, { addSuffix: true })}`
                      : 'Ongoing'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {session.duration !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{session.duration} minutes</p>
                      </div>
                    )}
                    {session.cost !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-medium">${session.cost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No past sessions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SetReminderDialog({
  sessionId,
  hasReminder,
  onSetReminder,
  onCancelReminder,
}: {
  sessionId: string;
  hasReminder: boolean;
  onSetReminder: (time: Date) => void;
  onCancelReminder: () => void;
}) {
  const [reminderTime, setReminderTime] = useState('');
  const [open, setOpen] = useState(false);

  const handleSetReminder = () => {
    if (!reminderTime) return;
    onSetReminder(new Date(reminderTime));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hasReminder ? (
        <Button variant="outline" onClick={onCancelReminder}>
          <BellOff className="h-4 w-4 mr-2" />
          Cancel Reminder
        </Button>
      ) : (
        <>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Set Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Reminder</DialogTitle>
              <DialogDescription>
                Get notified when your parking time is about to expire
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reminder Time</Label>
                <Input
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
              <Button onClick={handleSetReminder} className="w-full">
                Set Reminder
              </Button>
            </div>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

