export interface Geolocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error?: string;
}

let cachedGeolocation: Geolocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  timestamp: null,
};

let isWatching = false;

function updateGeolocation(position: GeolocationPosition): void {
  cachedGeolocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

function handleError(error: GeolocationPositionError): void {
  cachedGeolocation = {
    ...cachedGeolocation,
    error: error.message,
  };
}

export function initGeolocation(): void {
  if (isWatching || typeof navigator === "undefined" || !navigator.geolocation) {
    return;
  }

  isWatching = true;

  navigator.geolocation.getCurrentPosition(updateGeolocation, handleError, {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000,
  });

  navigator.geolocation.watchPosition(updateGeolocation, handleError, {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 60000,
  });
}

export function getGeolocation(): Geolocation {
  return { ...cachedGeolocation };
}
