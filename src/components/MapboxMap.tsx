import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  battery: number;
  location: { lat: number; lng: number };
  route: string;
}

interface MapboxMapProps {
  vehicles: Vehicle[];
}

const MapboxMap: React.FC<MapboxMapProps> = ({ vehicles }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1Ijoib3R0b3lhcmQiLCJhIjoiY21lZWY5cjduMGtsdzJpb2wxNWpweGg4NCJ9.NfsLzQ2-o8wEHOfRrPO5WQ');
  const [isTokenSet, setIsTokenSet] = useState(true);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add vehicle markers
    vehicles.forEach((vehicle) => {
      const markerColor = getStatusColor(vehicle.status);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'vehicle-marker';
      markerEl.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      // Create popup content
      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div class="p-2 bg-card text-card-foreground rounded-lg">
          <h3 class="font-semibold text-sm">${vehicle.name}</h3>
          <p class="text-xs text-muted-foreground">Status: ${vehicle.status}</p>
          <p class="text-xs text-muted-foreground">Battery: ${vehicle.battery}%</p>
          <p class="text-xs text-muted-foreground">Route: ${vehicle.route}</p>
        </div>
      `);

      new mapboxgl.Marker(markerEl)
        .setLngLat([vehicle.location.lng, vehicle.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'charging': return '#f59e0b'; // yellow
      case 'maintenance': return '#ef4444'; // red
      case 'idle': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Mapbox Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To use live mapping, please enter your Mapbox public token. 
            Get yours at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
          </p>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter Mapbox public token (pk.xxx...)"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTokenSubmit} className="bg-gradient-primary">
              <Settings className="h-4 w-4 mr-2" />
              Set Token
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapboxMap;