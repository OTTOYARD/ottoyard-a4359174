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

interface Depot {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  totalStalls: number;
  availableStalls: number;
  energyGenerated: number;
  energyReturned: number;
  vehiclesCharging: number;
  status: string;
}

interface MapboxMapProps {
  vehicles: Vehicle[];
  depots: Depot[];
  city?: { name: string; coordinates: [number, number] };
  onVehicleClick?: (vehicleId: string) => void;
  onDepotClick?: (depotId: string) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ vehicles, depots, city, onVehicleClick, onDepotClick }) => {
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

    // Use the passed depot data

    // Add vehicle markers - show all vehicles for the city
    vehicles.forEach((vehicle) => {
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
        transition: box-shadow 0.2s;
      `;

      // Create popup content
      const popup = new mapboxgl.Popup({ 
        offset: 15, 
        closeButton: false, 
        closeOnClick: false,
        className: 'vehicle-preview-popup'
      }).setHTML(`
        <div class="p-4 bg-card text-card-foreground rounded-lg border shadow-lg min-w-52">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-sm text-foreground">${vehicle.name}</h3>
            <span class="px-2 py-1 text-xs rounded-full ${vehicle.status === 'active' ? 'bg-success/20 text-success' : vehicle.status === 'charging' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}">${vehicle.status}</span>
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Battery:</span>
              <span class="font-medium ${vehicle.battery > 60 ? 'text-success' : vehicle.battery > 30 ? 'text-warning' : 'text-destructive'}">${vehicle.battery}%</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Route:</span>
              <span class="font-medium text-foreground">${vehicle.route}</span>
            </div>
          </div>
        </div>
      `);

      // Add hover preview popup
      const baseShadow = '0 2px 8px rgba(0,0,0,0.3)';
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
        popup.setLngLat([vehicle.location.lng, vehicle.location.lat]);
        popup.addTo(map.current!);
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.boxShadow = baseShadow;
        popup.remove();
      });

      // Add click handler
      markerEl.addEventListener('click', () => {
        onVehicleClick?.(vehicle.id);
      });

      new mapboxgl.Marker({ element: markerEl, anchor: 'center', offset: [0, 0] })
        .setLngLat([vehicle.location.lng, vehicle.location.lat])
        .addTo(map.current!);
    });

    // Add depot markers with null checks
    depots.forEach((depot) => {
      // Skip depots without location data
      if (!depot.location || typeof depot.location.lat !== 'number' || typeof depot.location.lng !== 'number') {
        console.warn('Skipping depot without valid location:', depot);
        return;
      }
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
        transition: box-shadow 0.2s;
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

      // Create popup content
      const depotPopup = new mapboxgl.Popup({ 
        offset: 15, 
        closeButton: false, 
        closeOnClick: false,
        className: 'depot-preview-popup'
      }).setHTML(`
        <div class="p-4 bg-card text-card-foreground rounded-lg border shadow-lg min-w-52">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-sm text-foreground">${depot.name}</h3>
            <span class="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">Depot</span>
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Available Stalls:</span>
              <span class="font-medium text-success">${depot.availableStalls}/${depot.totalStalls}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Charging Vehicles:</span>
              <span class="font-medium text-warning">${depot.vehiclesCharging}</span>
            </div>
          </div>
        </div>
      `);

      // Add hover preview popup
      const depotBaseShadow = '0 2px 8px rgba(0,0,0,0.3)';
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
        depotPopup.setLngLat([depot.location.lng, depot.location.lat]);
        depotPopup.addTo(map.current!);
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.boxShadow = depotBaseShadow;
        depotPopup.remove();
      });

      // Add click handler
      markerEl.addEventListener('click', () => {
        onDepotClick?.(depot.id);
      });

      new mapboxgl.Marker({ element: markerEl, anchor: 'center', offset: [0, 0] })
        .setLngLat([depot.location.lng, depot.location.lat])
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
  }, [isTokenSet, mapboxToken, vehicles, depots, city]);

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