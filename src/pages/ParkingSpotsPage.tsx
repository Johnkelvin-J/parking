// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import {
  getNearbyParkingSpots,
  verifyParkingSpot,
  deleteParkingSpot,
  markSpotAsTaken,
  addParkingSpot,
} from '@/services/parkingSpots';
import { startParkingSession } from '@/services/parkingSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  Clock,
  DollarSign,
  Car,
  Plus,
  CheckCircle,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { ParkingSpot, Vehicle } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const carIcon = L.divIcon({
  html: `<div class="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center w-full h-full">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function ParkingSpotsPage() {
  const { user } = useAuth();
  const { position, isLoading: locationLoading } = useGeolocation();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  const { data: spots, isLoading: spotsLoading } = useQuery({
    queryKey: ['parkingSpots', position?.latitude, position?.longitude],
    queryFn: () => {
      if (!position) return [];
      return getNearbyParkingSpots(position.latitude, position.longitude, 5, 50);
    },
    enabled: !!position,
  });

  const verifyMutation = useMutation({
    mutationFn: (spotId: string) => verifyParkingSpot(spotId, user?.id || ''),
    onSuccess: () => {
      toast.success('Spot verified! You earned 10 points.');
      queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify spot');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (spotId: string) => deleteParkingSpot(spotId, user?.id || ''),
    onSuccess: () => {
      toast.success('Spot deleted');
      queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete spot');
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: ({ spotId, vehicleId }: { spotId: string; vehicleId: string }) =>
      startParkingSession(user?.id || '', spotId, vehicleId),
    onSuccess: () => {
      toast.success('Parking session started!');
      queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      setSelectedSpot(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start session');
    },
  });

  const handleStartSession = () => {
    if (!selectedSpot || !selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    startSessionMutation.mutate({ spotId: selectedSpot.id, vehicleId: selectedVehicle });
  };

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parking Spots</h1>
          <p className="text-muted-foreground mt-1">
            Find and report parking spots
          </p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Spot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report a Parking Spot</DialogTitle>
              <DialogDescription>
                Share a parking spot with the community
              </DialogDescription>
            </DialogHeader>
            <AddSpotForm
              user={user}
              position={position}
              onSuccess={() => {
                setShowAddForm(false);
                queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {position && (
        <Card>
          <CardHeader>
            <CardTitle>Map View</CardTitle>
            <CardDescription>
              {spotsLoading ? 'Loading...' : `${spots?.length || 0} spots found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden">
              {/* @ts-ignore */}
              <MapContainer
                center={[position.latitude, position.longitude] as [number, number]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                {/* @ts-ignore */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* @ts-ignore */}
                <Marker position={[position.latitude, position.longitude] as [number, number]} icon={carIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
                {spots?.map((spot) => (
                  <Marker
                    key={spot.id}
                    position={[spot.location.latitude, spot.location.longitude] as [number, number]}
                    eventHandlers={{
                      click: () => setSelectedSpot(spot),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{spot.type} Parking</p>
                        {spot.cost !== null && <p>${spot.cost}/hr</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spotsLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : spots && spots.length > 0 ? (
          spots.map((spot) => (
            <Card
              key={spot.id}
              className={`cursor-pointer transition-colors ${selectedSpot?.id === spot.id ? 'border-primary' : ''
                }`}
              onClick={() => setSelectedSpot(spot)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="capitalize">
                    {spot.type}
                  </Badge>
                  {spot.verified && (
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">
                  {spot.location.address || 'Parking Spot'}
                </CardTitle>
                <CardDescription>
                  Reported {formatDistanceToNow(spot.timestamp, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    {spot.cost !== null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${spot.cost}/hr
                      </span>
                    )}
                    {spot.timeLimit !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {spot.timeLimit} min
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {spot.isHandicapAccessible && (
                      <Badge variant="secondary" className="text-xs">
                        Handicap
                      </Badge>
                    )}
                    {spot.isEVCharging && (
                      <Badge variant="secondary" className="text-xs">
                        EV
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        verifyMutation.mutate(spot.id);
                      }}
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    {spot.reporterId === user?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this spot?')) {
                            deleteMutation.mutate(spot.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No parking spots found</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Report First Spot
            </Button>
          </div>
        )}
      </div>

      {selectedSpot && (
        <Dialog open={!!selectedSpot} onOpenChange={() => setSelectedSpot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Parking Spot Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge className="capitalize">{selectedSpot.type}</Badge>
                </div>
                <div>
                  <Label>Cost</Label>
                  <p>{selectedSpot.cost !== null ? `$${selectedSpot.cost}/hr` : 'Free'}</p>
                </div>
                <div>
                  <Label>Time Limit</Label>
                  <p>
                    {selectedSpot.timeLimit !== null
                      ? `${selectedSpot.timeLimit} minutes`
                      : 'No limit'}
                  </p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <p>{selectedSpot.rating > 0 ? `${selectedSpot.rating.toFixed(1)}/5` : 'No ratings'}</p>
                </div>
              </div>
              {user?.vehicles && user.vehicles.length > 0 && (
                <div>
                  <Label>Select Vehicle</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                  >
                    <option value="">Choose a vehicle</option>
                    {user.vehicles.map((vehicle: Vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                {user?.vehicles && user.vehicles.length > 0 && (
                  <Button
                    onClick={handleStartSession}
                    disabled={!selectedVehicle || startSessionMutation.isPending}
                    className="flex-1"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Start Parking Session
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => verifyMutation.mutate(selectedSpot.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddSpotForm({
  user,
  position,
  onSuccess,
}: {
  user: any;
  position: { latitude: number; longitude: number } | null;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<'street' | 'garage' | 'lot'>('street');
  const [cost, setCost] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [isHandicapAccessible, setIsHandicapAccessible] = useState(false);
  const [isEVCharging, setIsEVCharging] = useState(false);
  const [address, setAddress] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    position ? { lat: position.latitude, lng: position.longitude } : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addParkingSpot(
        {
          reporterId: user.id,
          location: {
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng,
            address: address || undefined,
          },
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 2 * 60 * 60 * 1000),
          type,
          cost: cost ? parseFloat(cost) : null,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          isHandicapAccessible,
          isEVCharging,
          photos: [],
          status: 'available',
        },
        user,
        photoFile || undefined
      );
      toast.success('Parking spot reported! You earned 50 points.');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to report spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {position && (
        <div
          className="w-full rounded-md overflow-hidden border relative z-0 mb-4"
          style={{ height: '300px' }}
        >
          {/* @ts-ignore */}
          <MapContainer
            center={[position.latitude, position.longitude] as [number, number]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            dragging={true}
            scrollWheelZoom={false}
            ref={setMap as any}
          >
            {/* @ts-ignore */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* @ts-ignore */}
            <Marker
              position={[selectedLocation?.lat || position.latitude, selectedLocation?.lng || position.longitude] as [number, number]}
              draggable={true}
              eventHandlers={{
                dragend: (e: any) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  setSelectedLocation({ lat: position.lat, lng: position.lng });
                },
              }}
            />
          </MapContainer>
        </div>
      )}

      <div>
        <Label>Parking Type</Label>
        <select
          className="w-full mt-1 px-3 py-2 border rounded-md"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          required
        >
          <option value="street">Street</option>
          <option value="garage">Garage</option>
          <option value="lot">Lot</option>
        </select>
      </div>
      <div>
        <Label>Address (Optional)</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, State"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cost per hour ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>Time Limit (minutes)</Label>
          <Input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="No limit"
          />
        </div>
      </div>
      <div>
        <Label>Expires At</Label>
        <Input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Photo (Optional)</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setPhotoFile(e.target.files[0]);
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>
          <input
            type="checkbox"
            checked={isHandicapAccessible}
            onChange={(e) => setIsHandicapAccessible(e.target.checked)}
            className="mr-2"
          />
          Handicap Accessible
        </Label>
        <Label>
          <input
            type="checkbox"
            checked={isEVCharging}
            onChange={(e) => setIsEVCharging(e.target.checked)}
            className="mr-2"
          />
          EV Charging Available
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Reporting...' : 'Report Spot'}
      </Button>
    </form>
  );
}

