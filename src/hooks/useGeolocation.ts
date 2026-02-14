import { useState, useEffect } from 'react';

interface GeolocationState {
  isLoading: boolean;
  position: {
    latitude: number;
    longitude: number;
  } | null;
  error: GeolocationPositionError | null;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    isLoading: true,
    position: null,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        isLoading: false,
        position: null,
        error: {
          code: 0,
          message: 'Geolocation is not supported by this browser.',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        }
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        isLoading: false,
        position: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        error: null
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        isLoading: false,
        position: null,
        error
      });
    };

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { ...defaultOptions, ...options }
    );

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { ...defaultOptions, ...options }
    );

    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return state;
}
