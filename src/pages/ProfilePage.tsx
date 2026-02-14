import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Trophy, Car, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Vehicle } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProfilePage() {
  const { user } = useAuth();
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'userId'>) => {
    // In a real app, this would call a service to add the vehicle
    toast.success('Vehicle added successfully');
    setShowAddVehicle(false);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      // In a real app, this would call a service to delete the vehicle
      toast.success('Vehicle deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and vehicles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user?.displayName || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Name</Label>
                <Input value={user?.displayName || ''} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold">{user?.points || 0} Points</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicles
              </CardTitle>
              <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Vehicle</DialogTitle>
                    <DialogDescription>
                      Add a vehicle to your profile
                    </DialogDescription>
                  </DialogHeader>
                  <AddVehicleForm
                    onSuccess={(vehicle) => {
                      handleAddVehicle(vehicle);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {user?.vehicles && user.vehicles.length > 0 ? (
              <div className="space-y-3">
                {user.vehicles.map((vehicle: Vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.color} • {vehicle.licensePlate}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vehicles added</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddVehicleForm({ onSuccess }: { onSuccess: (vehicle: Omit<Vehicle, 'id' | 'userId'>) => void }) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      make,
      model,
      year: parseInt(year),
      licensePlate,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Make</Label>
          <Input value={make} onChange={(e) => setMake(e.target.value)} required />
        </div>
        <div>
          <Label>Model</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Color</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label>License Plate</Label>
        <Input
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Add Vehicle
      </Button>
    </form>
  );
}

