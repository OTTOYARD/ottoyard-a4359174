import { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Circle, Pentagon, RotateCcw, MapPin, Loader2, CheckCircle2, Pencil } from 'lucide-react';
import { useOttoResponseStore, ZonePoint } from '@/stores/ottoResponseStore';
import { AdaptedVehicle, isVehicleInZone, isVehicleNearZone } from '@/hooks/useOttoResponseData';
import { cn } from '@/lib/utils';

export type MapInteractionState = 'collapsed' | 'expanded' | 'confirmed';

interface OttoResponseMapProps {
  vehicles: AdaptedVehicle[];
  mapState: MapInteractionState;
  onMapStateChange: (state: MapInteractionState) => void;
  zoneConfirmed: boolean;
  onZoneConfirmed: (confirmed: boolean) => void;
}

// Mapbox token (same as main MapboxMap)
const MAPBOX_TOKEN = 'pk.eyJ1Ijoib3R0b3lhcmQiLCJhIjoiY21lZWY5cjduMGtsdzJpb2wxNWpweGg4NCJ9.NfsLzQ2-o8wEHOfRrPO5WQ';

// Traffic density mock zones for heatmap
const MOCK_TRAFFIC_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { intensity: 0.9 }, geometry: { type: 'Point', coordinates: [-86.78, 36.16] } },
    { type: 'Feature', properties: { intensity: 0.7 }, geometry: { type: 'Point', coordinates: [-86.75, 36.18] } },
    { type: 'Feature', properties: { intensity: 0.4 }, geometry: { type: 'Point', coordinates: [-86.82, 36.14] } },
    { type: 'Feature', properties: { intensity: 0.6 }, geometry: { type: 'Point', coordinates: [-86.80, 36.20] } },
    { type: 'Feature', properties: { intensity: 0.8 }, geometry: { type: 'Point', coordinates: [-86.77, 36.17] } },
    { type: 'Feature', properties: { intensity: 0.5 }, geometry: { type: 'Point', coordinates: [-86.79, 36.15] } },
    // Austin area
    { type: 'Feature', properties: { intensity: 0.85 }, geometry: { type: 'Point', coordinates: [-97.74, 30.27] } },
    { type: 'Feature', properties: { intensity: 0.65 }, geometry: { type: 'Point', coordinates: [-97.72, 30.29] } },
    // LA area
    { type: 'Feature', properties: { intensity: 0.75 }, geometry: { type: 'Point', coordinates: [-118.24, 34.05] } },
    { type: 'Feature', properties: { intensity: 0.55 }, geometry: { type: 'Point', coordinates: [-118.28, 34.07] } },
  ],
};

export function OttoResponseMap({ 
  vehicles, 
  mapState, 
  onMapStateChange, 
  zoneConfirmed, 
  onZoneConfirmed 
}: OttoResponseMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vehicleMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const zoneLayerRef = useRef<boolean>(false);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<ZonePoint[]>([]);
  const [radiusCenter, setRadiusCenter] = useState<ZonePoint | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(1);
  
  const {
    drawingMode,
    setDrawingMode,
    drawnZone,
    setDrawnZone,
    vehiclesInside,
    vehiclesNear,
  } = useOttoResponseStore();
  
  // Calculate map center from vehicles
  const getMapCenter = useCallback((): [number, number] => {
    if (vehicles.length === 0) return [-86.7816, 36.1627]; // Default Nashville
    const avgLng = vehicles.reduce((s, v) => s + v.location.lng, 0) / vehicles.length;
    const avgLat = vehicles.reduce((s, v) => s + v.location.lat, 0) / vehicles.length;
    return [avgLng, avgLat];
  }, [vehicles]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: getMapCenter(),
      zoom: 12,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setIsMapLoaded(true);
      
      // Add traffic heatmap layer
      map.current!.addSource('traffic-heat', {
        type: 'geojson',
        data: MOCK_TRAFFIC_DATA,
      });
      
      map.current!.addLayer({
        id: 'traffic-heat-layer',
        type: 'heatmap',
        source: 'traffic-heat',
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(34, 197, 94, 0.4)',
            0.4, 'rgba(245, 158, 11, 0.5)',
            0.6, 'rgba(245, 158, 11, 0.6)',
            0.8, 'rgba(239, 68, 68, 0.7)',
            1, 'rgba(239, 68, 68, 0.8)',
          ],
          'heatmap-radius': 60,
          'heatmap-opacity': 0.7,
        },
      });
      
      // Add zone source
      map.current!.addSource('zone', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      
      // Add zone fill layer
      map.current!.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zone',
        paint: {
          'fill-color': 'hsl(0, 85%, 60%)',
          'fill-opacity': 0.2,
        },
      });
      
      // Add zone outline layer
      map.current!.addLayer({
        id: 'zone-outline',
        type: 'line',
        source: 'zone',
        paint: {
          'line-color': 'hsl(0, 85%, 60%)',
          'line-width': 2,
        },
      });
      
      // Add buffer zone source
      map.current!.addSource('zone-buffer', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      
      // Add buffer outline layer
      map.current!.addLayer({
        id: 'zone-buffer-outline',
        type: 'line',
        source: 'zone-buffer',
        paint: {
          'line-color': 'hsl(45, 93%, 47%)',
          'line-width': 2,
          'line-dasharray': [4, 2],
        },
      });
      
      zoneLayerRef.current = true;
    });
    
    return () => {
      vehicleMarkersRef.current.forEach(m => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Handle map click for zone drawing
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const point: ZonePoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      
      if (drawingMode === 'radius') {
        setRadiusCenter(point);
        setDrawnZone({
          type: 'radius',
          center: point,
          radiusMiles: radiusMiles,
        });
      } else if (drawingMode === 'polygon') {
        const newPoints = [...polygonPoints, point];
        setPolygonPoints(newPoints);
        if (newPoints.length >= 3) {
          setDrawnZone({
            type: 'polygon',
            points: newPoints,
          });
        }
      }
    };
    
    map.current.on('click', handleClick);
    
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [isMapLoaded, drawingMode, polygonPoints, radiusMiles, setDrawnZone]);
  
  // Update zone visualization
  useEffect(() => {
    if (!map.current || !isMapLoaded || !zoneLayerRef.current) return;
    
    const zoneSource = map.current.getSource('zone') as mapboxgl.GeoJSONSource;
    const bufferSource = map.current.getSource('zone-buffer') as mapboxgl.GeoJSONSource;
    
    if (!zoneSource || !bufferSource) return;
    
    if (!drawnZone) {
      zoneSource.setData({ type: 'FeatureCollection', features: [] });
      bufferSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    
    if (drawnZone.type === 'radius' && drawnZone.center) {
      const center = [drawnZone.center.lng, drawnZone.center.lat];
      const radiusKm = (drawnZone.radiusMiles || 1) * 1.60934;
      const bufferKm = radiusKm + 0.5 * 1.60934;
      
      // Create circle polygon
      const createCircle = (centerLngLat: number[], radiusKm: number, points = 64) => {
        const coords: number[][] = [];
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusKm * Math.cos(angle);
          const dy = radiusKm * Math.sin(angle);
          const lat = centerLngLat[1] + (dy / 111.32);
          const lng = centerLngLat[0] + (dx / (111.32 * Math.cos(centerLngLat[1] * Math.PI / 180)));
          coords.push([lng, lat]);
        }
        return coords;
      };
      
      zoneSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [createCircle(center, radiusKm)],
        },
      } as any);
      
      bufferSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [createCircle(center, bufferKm)],
        },
      } as any);
    } else if (drawnZone.type === 'polygon' && drawnZone.points && drawnZone.points.length >= 3) {
      const coords = drawnZone.points.map(p => [p.lng, p.lat]);
      coords.push(coords[0]); // Close polygon
      
      zoneSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      } as any);
      
      bufferSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [drawnZone, isMapLoaded]);
  
  // Update radius zone when slider changes
  useEffect(() => {
    if (drawingMode === 'radius' && radiusCenter) {
      setDrawnZone({
        type: 'radius',
        center: radiusCenter,
        radiusMiles: radiusMiles,
      });
    }
  }, [radiusMiles, radiusCenter, drawingMode, setDrawnZone]);
  
  // Update vehicle markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Clear existing markers
    vehicleMarkersRef.current.forEach(m => m.remove());
    vehicleMarkersRef.current = [];
    
    vehicles.forEach((vehicle) => {
      const inZone = drawnZone && isVehicleInZone(vehicle, drawnZone);
      const nearZone = drawnZone && isVehicleNearZone(vehicle, drawnZone);
      
      let color = '#3b82f6'; // Default blue
      if (inZone) color = '#ef4444'; // Red for inside
      else if (nearZone) color = '#f59e0b'; // Orange for near
      
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 0 8px ${color}99;
        cursor: pointer;
      `;
      el.title = `${vehicle.name} - ${vehicle.status}`;
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([vehicle.location.lng, vehicle.location.lat])
        .addTo(map.current!);
      
      vehicleMarkersRef.current.push(marker);
    });
  }, [vehicles, drawnZone, isMapLoaded]);
  
  // Fit map to vehicles when they change significantly
  useEffect(() => {
    if (!map.current || !isMapLoaded || vehicles.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    vehicles.forEach(v => bounds.extend([v.location.lng, v.location.lat]));
    
    map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
  }, [vehicles.length, isMapLoaded]);
  
  // Close polygon
  const closePolygon = () => {
    if (polygonPoints.length >= 3) {
      setDrawnZone({
        type: 'polygon',
        points: polygonPoints,
      });
      setDrawingMode('none');
    }
  };
  
  // Reset drawing
  const resetDrawing = () => {
    setPolygonPoints([]);
    setRadiusCenter(null);
    setDrawnZone(null);
    setDrawingMode('none');
    onZoneConfirmed(false);
    onMapStateChange('collapsed');
  };

  // Confirm the zone and collapse map
  const handleConfirmZone = () => {
    onZoneConfirmed(true);
    onMapStateChange('confirmed');
    setDrawingMode('none');
  };

  // Edit the zone - expand map again
  const handleEditZone = () => {
    onZoneConfirmed(false);
    onMapStateChange('expanded');
  };

  // Activate map from collapsed state
  const handleActivateMap = () => {
    onMapStateChange('expanded');
  };

  // Check if map interactions should be disabled
  const isMapInteractive = mapState === 'expanded';
  
  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Tap to Engage Overlay - Only when collapsed and no zone confirmed */}
      {mapState === 'collapsed' && !zoneConfirmed && (
        <div 
          className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer z-20 transition-opacity"
          onClick={handleActivateMap}
        >
          <div className="bg-card/95 rounded-xl p-4 md:p-6 shadow-lg border border-border flex flex-col items-center gap-2 md:gap-3 mx-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Tap to Select Zone</p>
              <p className="text-xs text-muted-foreground mt-1">Draw a radius or polygon on the map</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Button - When zone is confirmed, positioned below legend on mobile */}
      {zoneConfirmed && mapState === 'confirmed' && (
        <div className="absolute top-12 right-2 z-20 md:top-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEditZone}
            className="h-7 px-2 text-xs bg-card/95 backdrop-blur"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit Zone
          </Button>
        </div>
      )}

      {/* Drawing Tools - Only show when expanded */}
      {mapState === 'expanded' && (
        <div className="p-2 border-b border-border flex flex-wrap gap-1.5 items-center justify-between bg-card/50">
          <div className="flex gap-1.5">
            <Button
              variant={drawingMode === 'radius' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setPolygonPoints([]);
                setRadiusCenter(null);
                setDrawnZone(null);
                setDrawingMode('radius');
              }}
              className="h-7 px-2 text-xs"
            >
              <Circle className="h-3.5 w-3.5 mr-1" />
              Radius
            </Button>
            <Button
              variant={drawingMode === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setPolygonPoints([]);
                setRadiusCenter(null);
                setDrawnZone(null);
                setDrawingMode('polygon');
              }}
              className="h-7 px-2 text-xs"
            >
              <Pentagon className="h-3.5 w-3.5 mr-1" />
              Polygon
            </Button>
            {(drawnZone || polygonPoints.length > 0) && (
              <Button variant="ghost" size="sm" onClick={resetDrawing} className="h-7 px-2 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Radius slider inline when active */}
          {drawingMode === 'radius' && (
            <div className="flex items-center gap-2 flex-1 max-w-[180px]">
              <Label className="text-[10px] text-muted-foreground whitespace-nowrap">
                {radiusMiles}mi
              </Label>
              <Slider
                value={[radiusMiles]}
                onValueChange={([val]) => setRadiusMiles(val)}
                min={0.25}
                max={5}
                step={0.25}
                className="flex-1"
              />
            </div>
          )}
          
          {drawingMode === 'polygon' && polygonPoints.length >= 3 && (
            <Button size="sm" onClick={closePolygon} className="h-7 px-2 text-xs">
              Close
            </Button>
          )}
        </div>
      )}
      
      {/* Map Container */}
      <div className="flex-1 relative min-h-0">
        <div 
          ref={mapContainer} 
          className={cn(
            "absolute inset-0 transition-opacity",
            !isMapInteractive && !zoneConfirmed && "pointer-events-none"
          )} 
        />
        
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Confirm Zone Button - Show when zone is drawn and map is expanded */}
        {mapState === 'expanded' && drawnZone && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <Button 
              onClick={handleConfirmZone}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Zone
            </Button>
          </div>
        )}
        
        {/* Compact Instructions overlay */}
        {isMapLoaded && mapState === 'expanded' && drawingMode !== 'none' && !drawnZone && (
          <div className="absolute bottom-12 left-2 right-2">
            <Card className="p-2 bg-card/95 backdrop-blur text-xs text-center">
              {drawingMode === 'radius' && 'Tap map to set zone center'}
              {drawingMode === 'polygon' && `Tap to add points (${polygonPoints.length}/3 min)`}
            </Card>
          </div>
        )}
        
        {/* Compact Zone Stats - Show when zone exists */}
        {drawnZone && (
          <div className={cn(
            "absolute right-2 z-10",
            mapState === 'expanded' ? "bottom-16" : "bottom-2"
          )}>
            <Card className="p-2 bg-card/95 backdrop-blur">
              <div className="flex gap-3 text-xs">
                <div className="text-center">
                  <p className="text-destructive font-bold text-sm">{vehiclesInside}</p>
                  <p className="text-muted-foreground text-[10px]">Inside</p>
                </div>
                <div className="text-center">
                  <p className="text-warning font-bold text-sm">{vehiclesNear}</p>
                  <p className="text-muted-foreground text-[10px]">Near</p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Traffic Legend - Minimal */}
        <div className={cn(
          "absolute top-2 left-2 z-10",
          !isMapInteractive && !zoneConfirmed && "hidden"
        )}>
          <Card className="p-1.5 bg-card/90 backdrop-blur text-[10px]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/80" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning/70" />
                <span>Med</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success/60" />
                <span>Low</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
