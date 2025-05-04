'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'; // Use MarkerF for functional component compatibility
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface MapDisplayProps {
  address: string;
  zoom?: number;
  containerStyle?: React.CSSProperties;
}

const defaultContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '300px', // Adjust default height as needed
  borderRadius: '0.5rem', // Match card rounding
};

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places']; // Add libraries if needed, 'places' for geocoding

const MapDisplay: React.FC<MapDisplayProps> = ({
  address,
  zoom = 14, // Default zoom level
  containerStyle = defaultContainerStyle,
}) => {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    console.warn("Google Maps API Key is missing or using placeholder. Map functionality will be disabled.");
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-destructive" />
          <p className="text-sm font-medium">Map Disabled</p>
          <p className="text-xs">Google Maps API Key is not configured.</p>
        </div>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
  });

  const geocodeAddress = useCallback(async () => {
    if (!isLoaded || !window.google || !window.google.maps || !window.google.maps.Geocoder) {
       console.warn("Google Maps API or Geocoder not loaded yet.");
      return;
    }
     console.log(`Geocoding address: ${address}`);
    setIsGeocoding(true);
    setMapError(null);
    const geocoder = new window.google.maps.Geocoder();
    try {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCenter({ lat: location.lat(), lng: location.lng() });
           console.log(`Geocoding successful: `, { lat: location.lat(), lng: location.lng() });
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
          setMapError(`Could not find location for "${address}". Status: ${status}`);
          setCenter(null); // Clear center on error
        }
        setIsGeocoding(false);
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      setMapError('An error occurred during geocoding.');
      setIsGeocoding(false);
    }
  }, [isLoaded, address]);


  useEffect(() => {
    if (isLoaded) {
      geocodeAddress();
    }
  }, [isLoaded, geocodeAddress]); // Rerun geocode if address changes or API loads

  // Handle API loading errors
  useEffect(() => {
    if (loadError) {
       console.error("Error loading Google Maps script:", loadError);
      setMapError("Failed to load Google Maps. Please check your API key and network connection.");
      setIsGeocoding(false); // Stop geocoding attempt if script fails
    }
  }, [loadError]);

  if (loadError || mapError) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-destructive" />
          <p className="text-sm font-medium">Map Error</p>
          <p className="text-xs px-4">{mapError || 'Could not load map.'}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || isGeocoding) {
    return <Skeleton style={containerStyle} />;
  }


  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center || { lat: 0, lng: 0 }} // Provide a default center if geocoding fails initially
      zoom={center ? zoom : 3} // Zoom out if location not found
      options={{
         disableDefaultUI: true, // Example: simplify UI
         zoomControl: true,
         streetViewControl: false,
         mapTypeControl: false,
         fullscreenControl: false,
       }}
    >
      {center && (
        <MarkerF
          position={center}
          title={address} // Add title for accessibility
        />
      )}
    </GoogleMap>
  );
};

export default MapDisplay;
