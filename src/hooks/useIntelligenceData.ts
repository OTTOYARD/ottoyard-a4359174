import { useEffect, useMemo } from 'react';
import { useIntelligenceStore, IntelligenceEvent, SourceKey, SourceStatus } from '@/stores/intelligenceStore';
import { calculateDistanceMiles } from '@/hooks/useOttoResponseData';

export interface EventWithImpact extends IntelligenceEvent {
  fleetImpact: {
    vehiclesInRadius: number;
    vehiclesInBuffer: number;
    nearestDepot: string | null;
    nearestDepotDistance: number | null;
  };
}

export interface IntelligenceMetrics {
  totalActive: number;
  criticalCount: number;
  highThreatCount: number;
  totalVehiclesAffected: number;
}

export function useIntelligenceData(
  vehicles?: any[],
  depots?: any[]
) {
  const store = useIntelligenceStore();

  useEffect(() => {
    store.fetchEvents();
    store.fetchConfig();
    const unsub = store.subscribeToRealtime();
    return unsub;
  }, []);

  // Compute fleet impact for each event
  const eventsWithImpact = useMemo<EventWithImpact[]>(() => {
    const vList = vehicles ?? [];
    const dList = depots ?? [];

    return store.events.map((event) => {
      let vehiclesInRadius = 0;
      let vehiclesInBuffer = 0;

      if (event.locationLat != null && event.locationLng != null) {
        const eLoc = { lat: event.locationLat, lng: event.locationLng };
        const radius = event.radiusMiles ?? 3;

        for (const v of vList) {
          const vLoc = v.location || { lat: v.lat, lng: v.lng || v.lon };
          if (!vLoc?.lat || !vLoc?.lng) continue;
          const dist = calculateDistanceMiles(eLoc, vLoc);
          if (dist <= radius) vehiclesInRadius++;
          else if (dist <= radius + 1) vehiclesInBuffer++;
        }
      }

      // Find nearest depot
      let nearestDepot: string | null = null;
      let nearestDepotDistance: number | null = null;

      if (event.locationLat != null && event.locationLng != null) {
        const eLoc = { lat: event.locationLat, lng: event.locationLng };
        for (const d of dList) {
          const dLoc = d.location || { lat: d.lat, lng: d.lng || d.lon };
          if (!dLoc?.lat || !dLoc?.lng) continue;
          const dist = calculateDistanceMiles(eLoc, dLoc);
          if (nearestDepotDistance === null || dist < nearestDepotDistance) {
            nearestDepotDistance = Math.round(dist * 10) / 10;
            nearestDepot = d.name || d.id;
          }
        }
      }

      return {
        ...event,
        fleetImpact: { vehiclesInRadius, vehiclesInBuffer, nearestDepot, nearestDepotDistance },
      };
    });
  }, [store.events, vehicles, depots]);

  const metrics = useMemo<IntelligenceMetrics>(() => {
    const events = store.events;
    return {
      totalActive: events.length,
      criticalCount: events.filter((e) => e.severity === 'critical' || e.severity === 'high').length,
      highThreatCount: events.filter((e) => e.threatScore >= 60).length,
      totalVehiclesAffected: events.reduce((sum, e) => sum + e.vehiclesAffected, 0),
    };
  }, [store.events]);

  const getEventsNearLocation = (lat: number, lng: number, radiusMiles: number) => {
    return eventsWithImpact.filter((e) => {
      if (e.locationLat == null || e.locationLng == null) return false;
      return calculateDistanceMiles({ lat, lng }, { lat: e.locationLat, lng: e.locationLng }) <= radiusMiles;
    });
  };

  return {
    events: eventsWithImpact,
    metrics,
    sourceStatus: store.sourceStatus,
    isScanning: store.isScanning,
    lastScanAt: store.lastScanAt,
    scanConfig: store.scanConfig,
    triggerScan: store.triggerScan,
    selectEvent: store.selectEvent,
    selectedEventId: store.selectedEventId,
    getEventsNearLocation,
  };
}
