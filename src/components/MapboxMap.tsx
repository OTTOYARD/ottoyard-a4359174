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
  city?: { name: string; coordinates: [number, number] };
  onVehicleClick?: (vehicleId: string) => void;
  onDepotClick?: (depotId: string) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ vehicles, city, onVehicleClick, onDepotClick }) => {
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
      style: 'mapbox://styles/mapbox/light-v11',
      center: city?.coordinates || [-122.4194, 37.7749], // Default to San Francisco
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Generate depot locations for the current city
    const generateDepots = () => {
      if (!city) return [];
      
      const depotNames = ['OTTOYARD Central Hub', 'OTTOYARD North Station', 'OTTOYARD Port Terminal'];
      return depotNames.map((name, index) => ({
        id: `depot-${index}`,
        name,
        location: {
          lat: city.coordinates[1] + (Math.random() - 0.5) * 0.05,
          lng: city.coordinates[0] + (Math.random() - 0.5) * 0.08
        },
        stalls: 8 + Math.floor(Math.random() * 8),
        available: Math.floor(Math.random() * 6) + 2
      }));
    };

    const depots = generateDepots();

    // Add vehicle markers
    vehicles.slice(0, 12).forEach((vehicle) => {
      const markerColor = getStatusColor(vehicle.status);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'vehicle-marker';
      markerEl.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
        transform-origin: center center;
      `;

      // Add hover effect
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)';
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });

      // Add click handler
      markerEl.addEventListener('click', () => {
        onVehicleClick?.(vehicle.id);
      });

      // Create popup content
      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div class="p-3 bg-card text-card-foreground rounded-lg border shadow-lg">
          <h3 class="font-semibold text-sm mb-1">${vehicle.name}</h3>
          <p class="text-xs text-muted-foreground">Status: ${vehicle.status}</p>
          <p class="text-xs text-muted-foreground">Battery: ${vehicle.battery}%</p>
          <p class="text-xs text-muted-foreground">Route: ${vehicle.route}</p>
          <p class="text-xs text-primary mt-1 cursor-pointer">Click to view in Fleet →</p>
        </div>
      `);

      new mapboxgl.Marker(markerEl)
        .setLngLat([vehicle.location.lng, vehicle.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add depot markers
    depots.forEach((depot) => {
      // Create custom depot marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'depot-marker';
      markerEl.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background-color: hsl(var(--primary));
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        transform-origin: center center;
      `;

      // Add inner square
      const innerSquare = document.createElement('div');
      innerSquare.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: white;
        border-radius: 2px;
      `;
      markerEl.appendChild(innerSquare);

      // Add hover effect
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)';
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });

      // Add click handler
      markerEl.addEventListener('click', () => {
        onDepotClick?.(depot.id);
      });

      // Create popup content
      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div class="p-3 bg-card text-card-foreground rounded-lg border shadow-lg">
          <h3 class="font-semibold text-sm mb-1">${depot.name}</h3>
          <p class="text-xs text-muted-foreground">Available Stalls: ${depot.available}/${depot.stalls}</p>
          <p class="text-xs text-primary mt-1 cursor-pointer">Click to view in Depots →</p>
        </div>
      `);

      new mapboxgl.Marker(markerEl)
        .setLngLat([depot.location.lng, depot.location.lat])
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
    if (isTokenSet && mapboxToken) {
      initializeMap();
    }
    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken, vehicles, city]);

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