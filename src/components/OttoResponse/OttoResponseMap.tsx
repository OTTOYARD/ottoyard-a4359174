import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Circle, Pentagon, RotateCcw, MapPin, Car } from 'lucide-react';
import { useOttoResponseStore, ZonePoint, TrafficSeverity } from '@/stores/ottoResponseStore';
import { AdaptedVehicle, isVehicleInZone, isVehicleNearZone } from '@/hooks/useOttoResponseData';
import { cn } from '@/lib/utils';

interface OttoResponseMapProps {
  vehicles: AdaptedVehicle[];
}

// Map bounds for visualization (Nashville area as default)
const MAP_BOUNDS = {
  minLat: 35.9,
  maxLat: 36.4,
  minLng: -87.1,
  maxLng: -86.5,
};

// Traffic density mock zones
interface TrafficZone {
  id: string;
  center: { lat: number; lng: number };
  radiusPx: number;
  severity: TrafficSeverity;
}

const MOCK_TRAFFIC_ZONES: TrafficZone[] = [
  { id: 't1', center: { lat: 36.16, lng: -86.78 }, radiusPx: 80, severity: 'High' },
  { id: 't2', center: { lat: 36.18, lng: -86.75 }, radiusPx: 60, severity: 'Medium' },
  { id: 't3', center: { lat: 36.14, lng: -86.82 }, radiusPx: 50, severity: 'Low' },
  { id: 't4', center: { lat: 36.20, lng: -86.80 }, radiusPx: 45, severity: 'Medium' },
];

export function OttoResponseMap({ vehicles }: OttoResponseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [polygonPoints, setPolygonPoints] = useState<ZonePoint[]>([]);
  const [radiusCenter, setRadiusCenter] = useState<ZonePoint | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(1);
  
  const {
    drawingMode,
    setDrawingMode,
    drawnZone,
    setDrawnZone,
    trafficSeverity,
    setTrafficSeverity,
    vehiclesInside,
    vehiclesNear,
    confidence,
  } = useOttoResponseStore();
  
  // Update map size on resize
  useEffect(() => {
    const updateSize = () => {
      if (mapRef.current) {
        setMapSize({
          width: mapRef.current.clientWidth,
          height: mapRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Convert lat/lng to pixel coordinates
  const toPixel = useCallback((lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * mapSize.width;
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * mapSize.height;
    return { x, y };
  }, [mapSize]);
  
  // Convert pixel to lat/lng
  const toLatLng = useCallback((x: number, y: number): ZonePoint => {
    const lng = MAP_BOUNDS.minLng + (x / mapSize.width) * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
    const lat = MAP_BOUNDS.maxLat - (y / mapSize.height) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
    return { lat, lng };
  }, [mapSize]);
  
  // Convert miles to pixels (rough approximation)
  const milesToPixels = useCallback((miles: number) => {
    const degreesPerMile = 1 / 69; // Approximate
    const lngSpan = MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng;
    const pixelsPerDegree = mapSize.width / lngSpan;
    return miles * degreesPerMile * pixelsPerDegree;
  }, [mapSize]);
  
  // Handle map click
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = toLatLng(x, y);
    
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
  };
  
  // Get traffic color
  const getTrafficColor = (severity: TrafficSeverity) => {
    switch (severity) {
      case 'High': return 'rgba(239, 68, 68, 0.4)';
      case 'Medium': return 'rgba(245, 158, 11, 0.35)';
      case 'Low': return 'rgba(34, 197, 94, 0.3)';
    }
  };
  
  // Get vehicle color based on zone status
  const getVehicleColor = (vehicle: AdaptedVehicle) => {
    if (drawnZone && isVehicleInZone(vehicle, drawnZone)) {
      return 'hsl(var(--destructive))';
    }
    if (drawnZone && isVehicleNearZone(vehicle, drawnZone)) {
      return 'hsl(var(--warning))';
    }
    return 'hsl(var(--primary))';
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Drawing Tools */}
      <div className="p-3 border-b border-border flex flex-wrap gap-2 items-center justify-between bg-card/50">
        <div className="flex gap-2">
          <Button
            variant={drawingMode === 'radius' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              resetDrawing();
              setDrawingMode('radius');
            }}
          >
            <Circle className="h-4 w-4 mr-1.5" />
            Radius
          </Button>
          <Button
            variant={drawingMode === 'polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              resetDrawing();
              setDrawingMode('polygon');
            }}
          >
            <Pentagon className="h-4 w-4 mr-1.5" />
            Polygon
          </Button>
          {(drawnZone || polygonPoints.length > 0) && (
            <Button variant="ghost" size="sm" onClick={resetDrawing}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
        
        {drawingMode === 'polygon' && polygonPoints.length >= 3 && (
          <Button size="sm" onClick={closePolygon}>
            Close Polygon
          </Button>
        )}
      </div>
      
      {/* Radius Slider */}
      {drawingMode === 'radius' && (
        <div className="p-3 border-b border-border bg-card/30">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Radius: {radiusMiles} mile{radiusMiles !== 1 ? 's' : ''}
          </Label>
          <Slider
            value={[radiusMiles]}
            onValueChange={([val]) => setRadiusMiles(val)}
            min={0.25}
            max={5}
            step={0.25}
            className="w-full"
          />
        </div>
      )}
      
      {/* Map Container */}
      <div
        ref={mapRef}
        className={cn(
          "flex-1 relative bg-background/80 cursor-crosshair overflow-hidden",
          "bg-[radial-gradient(circle_at_center,_hsl(var(--muted)/0.3)_0%,_transparent_70%)]"
        )}
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)/0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)/0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {/* Traffic Density Overlay */}
        {MOCK_TRAFFIC_ZONES.map((zone) => {
          const pos = toPixel(zone.center.lat, zone.center.lng);
          return (
            <div
              key={zone.id}
              className="absolute rounded-full blur-xl pointer-events-none transition-opacity"
              style={{
                left: pos.x - zone.radiusPx,
                top: pos.y - zone.radiusPx,
                width: zone.radiusPx * 2,
                height: zone.radiusPx * 2,
                background: getTrafficColor(zone.severity),
              }}
            />
          );
        })}
        
        {/* Drawn Radius Zone */}
        {drawnZone?.type === 'radius' && drawnZone.center && (
          <>
            {/* Buffer ring */}
            <div
              className="absolute rounded-full border-2 border-dashed border-warning/50 pointer-events-none"
              style={{
                left: toPixel(drawnZone.center.lat, drawnZone.center.lng).x - milesToPixels((drawnZone.radiusMiles || 1) + 0.5),
                top: toPixel(drawnZone.center.lat, drawnZone.center.lng).y - milesToPixels((drawnZone.radiusMiles || 1) + 0.5),
                width: milesToPixels((drawnZone.radiusMiles || 1) + 0.5) * 2,
                height: milesToPixels((drawnZone.radiusMiles || 1) + 0.5) * 2,
              }}
            />
            {/* Main zone */}
            <div
              className="absolute rounded-full border-2 border-primary bg-primary/20 pointer-events-none"
              style={{
                left: toPixel(drawnZone.center.lat, drawnZone.center.lng).x - milesToPixels(drawnZone.radiusMiles || 1),
                top: toPixel(drawnZone.center.lat, drawnZone.center.lng).y - milesToPixels(drawnZone.radiusMiles || 1),
                width: milesToPixels(drawnZone.radiusMiles || 1) * 2,
                height: milesToPixels(drawnZone.radiusMiles || 1) * 2,
              }}
            />
            {/* Center marker */}
            <div
              className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: toPixel(drawnZone.center.lat, drawnZone.center.lng).x,
                top: toPixel(drawnZone.center.lat, drawnZone.center.lng).y,
              }}
            />
          </>
        )}
        
        {/* Drawn Polygon Zone */}
        {(drawnZone?.type === 'polygon' || polygonPoints.length > 0) && (
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {/* Polygon fill */}
            {(drawnZone?.points || polygonPoints).length >= 3 && (
              <polygon
                points={(drawnZone?.points || polygonPoints)
                  .map((p) => `${toPixel(p.lat, p.lng).x},${toPixel(p.lat, p.lng).y}`)
                  .join(' ')}
                fill="hsl(var(--primary) / 0.2)"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
            )}
            {/* Lines while drawing */}
            {polygonPoints.length >= 2 && drawingMode === 'polygon' && (
              <polyline
                points={polygonPoints
                  .map((p) => `${toPixel(p.lat, p.lng).x},${toPixel(p.lat, p.lng).y}`)
                  .join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            {/* Point markers */}
            {(drawnZone?.points || polygonPoints).map((p, i) => {
              const pos = toPixel(p.lat, p.lng);
              return (
                <circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        )}
        
        {/* Vehicle Pins */}
        {vehicles.map((vehicle) => {
          const pos = toPixel(vehicle.location.lat, vehicle.location.lng);
          // Only render if in bounds
          if (pos.x < 0 || pos.x > mapSize.width || pos.y < 0 || pos.y > mapSize.height) {
            return null;
          }
          return (
            <div
              key={vehicle.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform z-10"
              style={{ left: pos.x, top: pos.y }}
              title={`${vehicle.name} - ${vehicle.status}`}
            >
              <Car
                className="h-4 w-4"
                style={{ color: getVehicleColor(vehicle) }}
              />
            </div>
          );
        })}
        
        {/* Instructions overlay */}
        {drawingMode !== 'none' && !drawnZone && (
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="p-3 bg-card/90 backdrop-blur text-sm">
              {drawingMode === 'radius' && 'Click on the map to set the zone center'}
              {drawingMode === 'polygon' && `Click to add points (${polygonPoints.length}/3 minimum)`}
            </Card>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute top-3 right-3">
          <Card className="p-2 bg-card/90 backdrop-blur text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <span>High Traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <span>Medium Traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <span>Low Traffic</span>
            </div>
          </Card>
        </div>
        
        {/* Zone Stats */}
        {drawnZone && (
          <div className="absolute bottom-4 right-4">
            <Card className="p-3 bg-card/90 backdrop-blur">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Inside Zone</p>
                  <p className="font-bold text-lg text-destructive">{vehiclesInside}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Near Zone</p>
                  <p className="font-bold text-lg text-warning">{vehiclesNear}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Confidence</p>
                  <Badge variant="outline">{confidence}</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Traffic Severity Selector */}
      <div className="p-3 border-t border-border bg-card/50 flex items-center gap-3">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Traffic Severity:</Label>
        <div className="flex gap-1">
          {(['Low', 'Medium', 'High'] as TrafficSeverity[]).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={trafficSeverity === level ? 'default' : 'outline'}
              onClick={() => setTrafficSeverity(level)}
              className={cn(
                "h-7 text-xs",
                trafficSeverity === level && level === 'High' && 'bg-destructive hover:bg-destructive/90',
                trafficSeverity === level && level === 'Medium' && 'bg-warning hover:bg-warning/90',
                trafficSeverity === level && level === 'Low' && 'bg-success hover:bg-success/90'
              )}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
