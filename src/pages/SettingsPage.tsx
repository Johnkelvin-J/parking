import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Moon, Sun, Bell, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserPreferences } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const prefDoc = await getDoc(doc(db, 'userPreferences', user.id));
      if (!prefDoc.exists()) return null;
      return prefDoc.data() as UserPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user?.id) return;
      const prefRef = doc(db, 'userPreferences', user.id);
      await updateDoc(prefRef, updates);
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const [notificationRadius, setNotificationRadius] = useState(
    preferences?.notificationRadius?.toString() || '1'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    preferences?.notificationsEnabled ?? true
  );
  const [maxParkingCost, setMaxParkingCost] = useState(
    preferences?.maxParkingCost?.toString() || ''
  );
  const [preferredTypes, setPreferredTypes] = useState<string[]>(
    preferences?.preferredParkingTypes || ['street', 'garage', 'lot']
  );

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      notificationRadius: parseFloat(notificationRadius),
      notificationsEnabled,
      maxParkingCost: maxParkingCost ? parseFloat(maxParkingCost) : null,
      preferredParkingTypes: preferredTypes as Array<'street' | 'garage' | 'lot'>,
    });
  };

  const toggleParkingType = (type: string) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your parking finder experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about parking spots
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div>
              <Label>Notification Radius (miles)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={notificationRadius}
                onChange={(e) => setNotificationRadius(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Get notified about spots within this radius
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Parking Preferences
            </CardTitle>
            <CardDescription>Set your parking preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preferred Parking Types</Label>
              <div className="flex gap-2 mt-2">
                {['street', 'garage', 'lot'].map((type) => (
                  <Button
                    key={type}
                    variant={preferredTypes.includes(type) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleParkingType(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Maximum Parking Cost ($/hr)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={maxParkingCost}
                onChange={(e) => setMaxParkingCost(e.target.value)}
                placeholder="No limit"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Only show spots below this cost (leave empty for no limit)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize the app appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences} disabled={updatePreferencesMutation.isPending}>
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

