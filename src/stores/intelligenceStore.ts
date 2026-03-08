import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type IntelligenceSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SourceKey = 'weather' | 'traffic' | 'news' | 'emergency';
export type SourceStatus = 'connected' | 'scanning' | 'error' | 'disabled' | 'idle';

export interface IntelligenceEvent {
  id: string;
  source: string;
  sourceId: string | null;
  eventType: string;
  severity: IntelligenceSeverity;
  title: string;
  description: string | null;
  locationLat: number | null;
  locationLng: number | null;
  radiusMiles: number | null;
  geojson: any | null;
  city: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  threatScore: number;
  vehiclesAffected: number;
  vehiclesNearby: number;
  autoRecommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScanConfig {
  weatherEnabled: boolean;
  weatherIntervalMinutes: number;
  weatherLastScanAt: string | null;
  weatherLastStatus: string;
  weatherLastError: string | null;
  trafficEnabled: boolean;
  trafficIntervalMinutes: number;
  trafficLastScanAt: string | null;
  trafficLastStatus: string;
  trafficLastError: string | null;
  newsEnabled: boolean;
  newsIntervalMinutes: number;
  newsLastScanAt: string | null;
  newsLastStatus: string;
  newsLastError: string | null;
  emergencyEnabled: boolean;
  emergencyIntervalMinutes: number;
  emergencyLastScanAt: string | null;
  emergencyLastStatus: string;
  emergencyLastError: string | null;
  cities: string[];
  autoExpireHours: number;
  threatScoreThreshold: number;
}

function mapRowToEvent(row: any): IntelligenceEvent {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    eventType: row.event_type,
    severity: row.severity as IntelligenceSeverity,
    title: row.title,
    description: row.description,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    radiusMiles: row.radius_miles,
    geojson: row.geojson,
    city: row.city,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    threatScore: row.threat_score ?? 0,
    vehiclesAffected: row.vehicles_affected ?? 0,
    vehiclesNearby: row.vehicles_nearby ?? 0,
    autoRecommendations: row.auto_recommendations ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConfigRow(row: any): ScanConfig {
  return {
    weatherEnabled: row.weather_enabled,
    weatherIntervalMinutes: row.weather_interval_minutes,
    weatherLastScanAt: row.weather_last_scan_at,
    weatherLastStatus: row.weather_last_status ?? 'idle',
    weatherLastError: row.weather_last_error,
    trafficEnabled: row.traffic_enabled,
    trafficIntervalMinutes: row.traffic_interval_minutes,
    trafficLastScanAt: row.traffic_last_scan_at,
    trafficLastStatus: row.traffic_last_status ?? 'idle',
    trafficLastError: row.traffic_last_error,
    newsEnabled: row.news_enabled,
    newsIntervalMinutes: row.news_interval_minutes,
    newsLastScanAt: row.news_last_scan_at,
    newsLastStatus: row.news_last_status ?? 'idle',
    newsLastError: row.news_last_error,
    emergencyEnabled: row.emergency_enabled,
    emergencyIntervalMinutes: row.emergency_interval_minutes,
    emergencyLastScanAt: row.emergency_last_scan_at,
    emergencyLastStatus: row.emergency_last_status ?? 'disabled',
    emergencyLastError: row.emergency_last_error,
    cities: row.cities ?? [],
    autoExpireHours: row.auto_expire_hours ?? 24,
    threatScoreThreshold: row.threat_score_threshold ?? 40,
  };
}

function deriveSourceStatus(config: ScanConfig | null): Record<SourceKey, SourceStatus> {
  if (!config) return { weather: 'idle', traffic: 'idle', news: 'idle', emergency: 'idle' };

  const derive = (enabled: boolean, lastStatus: string, lastScanAt: string | null): SourceStatus => {
    if (!enabled) return 'disabled';
    if (lastStatus === 'error') return 'error';
    if (lastStatus === 'success' && lastScanAt) {
      const age = Date.now() - new Date(lastScanAt).getTime();
      return age < 10 * 60 * 1000 ? 'connected' : 'idle';
    }
    return 'idle';
  };

  return {
    weather: derive(config.weatherEnabled, config.weatherLastStatus, config.weatherLastScanAt),
    traffic: derive(config.trafficEnabled, config.trafficLastStatus, config.trafficLastScanAt),
    news: derive(config.newsEnabled, config.newsLastStatus, config.newsLastScanAt),
    emergency: derive(config.emergencyEnabled, config.emergencyLastStatus, config.emergencyLastScanAt),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

interface IntelligenceState {
  events: IntelligenceEvent[];
  scanConfig: ScanConfig | null;
  isScanning: boolean;
  lastScanAt: Date | null;
  selectedEventId: string | null;
  sourceStatus: Record<SourceKey, SourceStatus>;

  // Actions
  fetchEvents: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  triggerScan: () => Promise<void>;
  clearAllEvents: () => Promise<void>;
  selectEvent: (id: string | null) => void;
  updateConfig: (updates: Partial<Record<string, any>>) => Promise<void>;
  subscribeToRealtime: () => () => void;

  // Computed getters
  activeEvents: () => IntelligenceEvent[];
  criticalEvents: () => IntelligenceEvent[];
  highThreatEvents: () => IntelligenceEvent[];
  eventsByCity: (city: string) => IntelligenceEvent[];
  eventsBySource: (source: string) => IntelligenceEvent[];
}

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  events: [],
  scanConfig: null,
  isScanning: false,
  lastScanAt: null,
  selectedEventId: null,
  sourceStatus: { weather: 'idle', traffic: 'idle', news: 'idle', emergency: 'idle' },

  fetchEvents: async () => {
    const { data, error } = await supabase
      .from('intelligence_events')
      .select('*')
      .eq('is_active', true)
      .order('threat_score', { ascending: false })
      .limit(200);

    if (!error && data) {
      set({ events: data.map(mapRowToEvent) });
    }
  },

  fetchConfig: async () => {
    const { data, error } = await supabase
      .from('scanner_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (!error && data) {
      const config = mapConfigRow(data);
      set({ scanConfig: config, sourceStatus: deriveSourceStatus(config) });
    }
  },

  triggerScan: async () => {
    set({ isScanning: true });
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      await fetch(`https://${projectId}.supabase.co/functions/v1/intelligence-scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error('Scan trigger error:', err);
    } finally {
      set({ isScanning: false, lastScanAt: new Date() });
      // Re-fetch data after scan
      await get().fetchEvents();
      await get().fetchConfig();
    }
  },

  clearAllEvents: async () => {
    await supabase
      .from('intelligence_events')
      .update({ is_active: false })
      .eq('is_active', true);
    set({ events: [] });
  },

  selectEvent: (id) => set({ selectedEventId: id }),

  updateConfig: async (updates) => {
    await supabase.from('scanner_config').update(updates).eq('id', 'default');
    await get().fetchConfig();
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel(`intelligence-events-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'intelligence_events' },
        (payload) => {
          const newEvent = mapRowToEvent(payload.new);
          set((s) => ({ events: [newEvent, ...s.events].slice(0, 200) }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'intelligence_events' },
        (payload) => {
          const updated = mapRowToEvent(payload.new);
          set((s) => ({
            events: updated.isActive
              ? s.events.map((e) => (e.id === updated.id ? updated : e))
              : s.events.filter((e) => e.id !== updated.id),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Computed getters
  activeEvents: () => get().events.filter((e) => e.isActive),
  criticalEvents: () => get().events.filter((e) => e.severity === 'critical' || e.severity === 'high'),
  highThreatEvents: () => get().events.filter((e) => e.threatScore >= 60),
  eventsByCity: (city) => get().events.filter((e) => e.city === city),
  eventsBySource: (source) => get().events.filter((e) => e.source === source),
}));
