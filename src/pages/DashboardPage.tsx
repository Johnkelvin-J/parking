// @ts-nocheck
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { getNearbyParkingSpots } from '@/services/parkingSpots';
import { getActiveSessionForUser } from '@/services/parkingSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Car, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { ParkingSpot, ParkingSession } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function DashboardPage() {
  const { user } = useAuth();
  const { position, isLoading: locationLoading, error: locationError } = useGeolocation();
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

  const { data: spots, isLoading: spotsLoading } = useQuery({
    queryKey: ['nearbySpots', position?.latitude, position?.longitude],
    queryFn: () => {
      if (!position) return [];
      return getNearbyParkingSpots(position.latitude, position.longitude, 2, 10);
    },
    enabled: !!position,
  });

  const { data: activeSession } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => {
      if (!user?.id) return null;
      return getActiveSessionForUser(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Location Access Required
            </CardTitle>
            <CardDescription>
              Please enable location access to find nearby parking spots.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Location Not Available</CardTitle>
            <CardDescription>
              Unable to get your location. Please check your browser settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Find parking spots near you
        </p>
      </div>

      {activeSession && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Active Parking Session
            </CardTitle>
            <CardDescription>
              You have an active parking session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Started {formatDistanceToNow(activeSession.startTime, { addSuffix: true })}
                </p>
              </div>
              <Link to="/sessions">
                <Button>View Session</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
              <CardDescription>
                {spotsLoading ? 'Loading spots...' : `${spots?.length || 0} spots nearby`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[position.latitude, position.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[position.latitude, position.longitude]}
                  >
                    <Popup>Your Location</Popup>
                  </Marker>
                  {spots?.map((spot) => (
                    <Marker
                      key={spot.id}
                      position={[spot.location.latitude, spot.location.longitude]}
                      eventHandlers={{
                        click: () => setSelectedSpot(spot),
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{spot.type} Parking</p>
                          {spot.cost !== null && (
                            <p>${spot.cost}/hr</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Spots</CardTitle>
              <CardDescription>
                {spotsLoading ? 'Loading...' : `${spots?.length || 0} available spots`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : spots && spots.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {spots.map((spot) => (
                    <Card
                      key={spot.id}
                      className={`cursor-pointer transition-colors ${selectedSpot?.id === spot.id ? 'border-primary' : ''
                        }`}
                      onClick={() => setSelectedSpot(spot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="capitalize">
                            {spot.type}
                          </Badge>
                          {spot.verified && (
                            <Badge variant="default" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {spot.location.address || 'Parking Spot'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {spot.cost !== null && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${spot.cost}/hr
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(spot.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No parking spots found nearby</p>
                  <Link to="/parking-spots">
                    <Button variant="outline" className="mt-4">
                      Report a Spot
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedSpot && (
        <Card>
          <CardHeader>
            <CardTitle>Spot Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Type</p>
                <Badge className="capitalize">{selectedSpot.type}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Cost</p>
                <p>{selectedSpot.cost !== null ? `$${selectedSpot.cost}/hr` : 'Free'}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Time Limit</p>
                <p>
                  {selectedSpot.timeLimit !== null
                    ? `${selectedSpot.timeLimit} minutes`
                    : 'No limit'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Features</p>
                <div className="flex gap-2">
                  {selectedSpot.isHandicapAccessible && (
                    <Badge variant="secondary">Handicap</Badge>
                  )}
                  {selectedSpot.isEVCharging && (
                    <Badge variant="secondary">EV Charging</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Reported</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(selectedSpot.timestamp, { addSuffix: true })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Rating</p>
                <p>{selectedSpot.rating > 0 ? `${selectedSpot.rating.toFixed(1)}/5` : 'No ratings yet'}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/parking-spots" className="flex-1">
                <Button className="w-full">View All Spots</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

