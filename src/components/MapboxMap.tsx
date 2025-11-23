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
  const vehicleMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const depotMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1Ijoib3R0b3lhcmQiLCJhIjoiY21lZWY5cjduMGtsdzJpb2wxNWpweGg4NCJ9.NfsLzQ2-o8wEHOfRrPO5WQ');
  const [isTokenSet, setIsTokenSet] = useState(true);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: city?.coordinates || [-122.4194, 37.7749], // Default to San Francisco
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // Clear existing vehicle markers
    vehicleMarkersRef.current.forEach(marker => marker.remove());
    vehicleMarkersRef.current = [];

    // Clear existing depot markers
    depotMarkersRef.current.forEach(marker => marker.remove());
    depotMarkersRef.current = [];

    // Remove existing route layers and sources
    if (map.current.getLayer('routes')) {
      map.current.removeLayer('routes');
    }
    if (map.current.getSource('routes')) {
      map.current.removeSource('routes');
    }

    // Add vehicle markers - show all vehicles for the city
    vehicles.forEach((vehicle, index) => {
      console.log(`Rendering vehicle ${index + 1}/${vehicles.length}:`, vehicle.name, vehicle.location);
      const markerColor = getVehicleHealthColor(vehicle.battery, vehicle.status);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'vehicle-marker';
      markerEl.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 20px ${markerColor}cc;
        cursor: pointer;
        transition: box-shadow 0.2s, filter 0.2s;
        pointer-events: auto;
        position: relative;
      `;

      // Create popup content
      const popup = new mapboxgl.Popup({ 
        offset: [0, -32],
        anchor: 'bottom',
        closeButton: false, 
        closeOnClick: false,
        closeOnMove: false,
        className: 'vehicle-preview-popup'
      }).setHTML(`
        <div class="p-4 bg-card text-card-foreground rounded-lg border shadow-lg min-w-52" style="position: relative; z-index: 1000;">
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

      // Add hover preview popup with improved timing
      const baseShadow = `0 3px 12px rgba(0,0,0,0.5), 0 0 20px ${markerColor}cc`;
      let showTimeout: NodeJS.Timeout | null = null;
      let hideTimeout: NodeJS.Timeout | null = null;

      const showPopup = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        showTimeout = setTimeout(() => {
          popup.setLngLat([vehicle.location.lng, vehicle.location.lat]);
          popup.addTo(map.current!);
          
          // Keep popup open when hovering over it
          const popupEl = document.querySelector('.vehicle-preview-popup');
          if (popupEl) {
            popupEl.addEventListener('mouseenter', () => {
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
            });
            popupEl.addEventListener('mouseleave', () => {
              hidePopup();
            });
          }
        }, 150);
      };

      const hidePopup = () => {
        if (showTimeout) {
          clearTimeout(showTimeout);
          showTimeout = null;
        }
        hideTimeout = setTimeout(() => {
          popup.remove();
        }, 300);
      };

      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.boxShadow = `0 5px 20px rgba(0,0,0,0.7), 0 0 40px ${markerColor}`;
        markerEl.style.filter = 'brightness(1.2)';
        showPopup();
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.boxShadow = baseShadow;
        markerEl.style.filter = 'brightness(1)';
        hidePopup();
      });

      // Add click handler
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Vehicle clicked:', vehicle.id);
        onVehicleClick?.(vehicle.id);
      });

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center', offset: [0, 0] })
        .setLngLat([vehicle.location.lng, vehicle.location.lat])
        .addTo(map.current!);
      
      vehicleMarkersRef.current.push(marker);
    });

    // Add depot markers - all depots now have guaranteed valid locations
    depots.forEach((depot, index) => {
      console.log(`Rendering depot ${index + 1}/${depots.length}:`, depot.name, depot.location);
      
      // Create custom depot marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'depot-marker';
      markerEl.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background-color: #ef4444;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 20px rgba(239, 68, 68, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        pointer-events: auto;
        position: relative;
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
        offset: [0, -36], 
        anchor: 'bottom',
        closeButton: false, 
        closeOnClick: false,
        closeOnMove: false,
        className: 'depot-preview-popup'
      }).setHTML(`
        <div class="p-4 bg-card text-card-foreground rounded-lg border shadow-lg min-w-52" style="position: relative; z-index: 1000;">
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

      // Add hover preview popup with improved timing
      const depotBaseShadow = '0 3px 12px rgba(0,0,0,0.5), 0 0 20px rgba(239, 68, 68, 0.6)';
      let depotShowTimeout: NodeJS.Timeout | null = null;
      let depotHideTimeout: NodeJS.Timeout | null = null;

      const showDepotPopup = () => {
        if (depotHideTimeout) {
          clearTimeout(depotHideTimeout);
          depotHideTimeout = null;
        }
        depotShowTimeout = setTimeout(() => {
          depotPopup.setLngLat([depot.location.lng, depot.location.lat]);
          depotPopup.addTo(map.current!);
          
          // Keep popup open when hovering over it
          const popupEl = document.querySelector('.depot-preview-popup');
          if (popupEl) {
            popupEl.addEventListener('mouseenter', () => {
              if (depotHideTimeout) {
                clearTimeout(depotHideTimeout);
                depotHideTimeout = null;
              }
            });
            popupEl.addEventListener('mouseleave', () => {
              hideDepotPopup();
            });
          }
        }, 150);
      };

      const hideDepotPopup = () => {
        if (depotShowTimeout) {
          clearTimeout(depotShowTimeout);
          depotShowTimeout = null;
        }
        depotHideTimeout = setTimeout(() => {
          depotPopup.remove();
        }, 300);
      };

      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.boxShadow = '0 5px 20px rgba(0,0,0,0.7), 0 0 40px rgba(239, 68, 68, 1)';
        markerEl.style.filter = 'brightness(1.2)';
        showDepotPopup();
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.boxShadow = depotBaseShadow;
        markerEl.style.filter = 'brightness(1)';
        hideDepotPopup();
      });

      // Add click handler
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Depot clicked:', depot.id);
        onDepotClick?.(depot.id);
      });

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center', offset: [0, 0] })
        .setLngLat([depot.location.lng, depot.location.lat])
        .addTo(map.current!);
      
      depotMarkersRef.current.push(marker);
    });
    
    // Helper function to create curved path between points (simulating street patterns)
    const createCurvedPath = (start: [number, number], end: [number, number], waypoints: number = 3) => {
      const coordinates: [number, number][] = [start];
      
      // Add intermediate waypoints with slight offsets to simulate street turns
      for (let i = 1; i < waypoints; i++) {
        const ratio = i / waypoints;
        const baseLng = start[0] + (end[0] - start[0]) * ratio;
        const baseLat = start[1] + (end[1] - start[1]) * ratio;
        
        // Add perpendicular offset to create curves
        const offsetMagnitude = 0.002 * Math.sin(ratio * Math.PI);
        const perpOffsetLng = -(end[1] - start[1]) * offsetMagnitude;
        const perpOffsetLat = (end[0] - start[0]) * offsetMagnitude;
        
        coordinates.push([baseLng + perpOffsetLng, baseLat + perpOffsetLat]);
      }
      
      coordinates.push(end);
      return coordinates;
    };

    // Add route lines for vehicles with route paths (single continuous line per vehicle)
    const vehiclesWithRoutes = vehicles.filter((vehicle: any) => vehicle.routePath?.pickup && vehicle.routePath?.dropoff);
    console.log(`🛣️ Found ${vehiclesWithRoutes.length} vehicles with route paths out of ${vehicles.length} total vehicles`);
    
    const routeFeatures = vehiclesWithRoutes.map((vehicle: any) => {
      // Create one continuous curved path: vehicle -> pickup -> dropoff
      const startToPickup = createCurvedPath(
        [vehicle.location.lng, vehicle.location.lat],
        [vehicle.routePath.pickup.lng, vehicle.routePath.pickup.lat],
        2
      );
      const pickupToDropoff = createCurvedPath(
        [vehicle.routePath.pickup.lng, vehicle.routePath.pickup.lat],
        [vehicle.routePath.dropoff.lng, vehicle.routePath.dropoff.lat],
        3
      );
      
      // Combine into single path (remove duplicate pickup point)
      const fullPath = [...startToPickup, ...pickupToDropoff.slice(1)];
      
      return {
        type: 'Feature' as const,
        properties: {
          vehicleId: vehicle.id,
          color: getVehicleHealthColor(vehicle.battery, vehicle.status)
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: fullPath
        }
      };
    });

    if (routeFeatures.length > 0) {
      console.log(`✅ Adding ${routeFeatures.length} route lines to map`);
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });

      map.current.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.6
        }
      });
    } else {
      console.log('⚠️ No route features to display');
    }

    // Summary logging
    console.log(`✅ MapboxMap: Rendered ${vehicleMarkersRef.current.length} vehicle markers, ${depotMarkersRef.current.length} depot markers, and ${routeFeatures.length} routes`);
  };

  const getVehicleHealthColor = (battery: number, status: string): string => {
    // Health-based bright colors matching the vehicle health card system
    if (status === 'maintenance' || status === 'in_service') {
      return '#ff3b30'; // Bright red for maintenance/critical
    }
    if (battery >= 80) {
      return '#34c759'; // Bright green for excellent health
    }
    if (battery >= 60) {
      return '#30d158'; // Bright lime green for good health
    }
    if (battery >= 40) {
      return '#ffd60a'; // Bright yellow for fair health
    }
    if (battery >= 20) {
      return '#ff9f0a'; // Bright orange for poor health
    }
    return '#ff3b30'; // Bright red for critical
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

  // Initialize map once
  useEffect(() => {
    if (isTokenSet && mapboxToken && !map.current) {
      initializeMap();
    }
    return () => {
      vehicleMarkersRef.current.forEach(marker => marker.remove());
      depotMarkersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [isTokenSet, mapboxToken]);

  // Update markers when vehicles or depots change
  useEffect(() => {
    if (map.current && isTokenSet) {
      updateMarkers();
    }
  }, [vehicles, depots]);

  // Update map center when city changes
  useEffect(() => {
    if (map.current && city?.coordinates) {
      map.current.setCenter(city.coordinates);
    }
  }, [city]);

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
      
      {/* City Stats Overlay */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 space-y-2 z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{city?.name || 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success border border-white"></div>
            <span>{vehicles.length} Vehicles</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-primary border border-white"></div>
            <span>{depots.length} Depots</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;