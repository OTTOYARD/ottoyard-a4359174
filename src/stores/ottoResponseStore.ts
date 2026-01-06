import { create } from 'zustand';

export type TrafficSeverity = 'Low' | 'Medium' | 'High';
export type ZoneType = 'radius' | 'polygon' | null;
export type AdvisoryStatus = 'Draft' | 'Submitted' | 'Acknowledged';
export type AIProvider = 'openai' | 'anthropic';

export interface ZonePoint {
  lat: number;
  lng: number;
}

export interface DrawnZone {
  type: ZoneType;
  center?: ZonePoint;
  radiusMiles?: number;
  points?: ZonePoint[];
}

export interface SafeHarbor {
  id: string;
  name: string;
  type: 'Depot' | 'Partner';
  distanceFromZone: number;
  availableCapacity: number;
  location: { lat: number; lng: number };
}

export interface Advisory {
  id: string;
  timestamp: Date;
  severity: TrafficSeverity;
  zoneType: ZoneType;
  zone: DrawnZone | null;
  vehiclesInside: number;
  vehiclesNear: number;
  recommendations: {
    pauseDispatches: boolean;
    avoidZoneRouting: boolean;
    waveBasedRecovery: boolean;
    waveSize?: number;
    waveIntervalMinutes?: number;
    safeHarborStaging: boolean;
    keepClearCorridors: boolean;
  };
  selectedSafeHarbors: SafeHarbor[];
  oemNotes: string;
  status: AdvisoryStatus;
  aiGeneratedSummary?: string;
}

interface OttoResponseState {
  // Panel state
  isPanelOpen: boolean;
  
  // Traffic state
  trafficSeverity: TrafficSeverity;
  lastUpdated: Date;
  
  // Zone drawing
  drawingMode: 'none' | 'radius' | 'polygon';
  drawnZone: DrawnZone | null;
  
  // Zone analytics
  vehiclesInside: number;
  vehiclesNear: number;
  confidence: TrafficSeverity;
  
  // Recommendations
  recommendations: {
    pauseDispatches: boolean;
    avoidZoneRouting: boolean;
    waveBasedRecovery: boolean;
    waveSize: number;
    waveIntervalMinutes: number;
    safeHarborStaging: boolean;
    keepClearCorridors: boolean;
  };
  
  // Safe Harbors
  selectedSafeHarbors: SafeHarbor[];
  
  // OEM Notes
  oemNotes: string;
  
  // Advisories
  advisories: Advisory[];
  nextAdvisoryNumber: number;
  
  // AI
  aiProvider: AIProvider;
  isAILoading: boolean;
  
  // Actions
  openPanel: () => void;
  closePanel: () => void;
  setDrawingMode: (mode: 'none' | 'radius' | 'polygon') => void;
  setDrawnZone: (zone: DrawnZone | null) => void;
  setTrafficSeverity: (severity: TrafficSeverity) => void;
  updateZoneAnalytics: (inside: number, near: number) => void;
  setRecommendation: (key: keyof OttoResponseState['recommendations'], value: boolean | number) => void;
  toggleSafeHarbor: (harbor: SafeHarbor) => void;
  setOemNotes: (notes: string) => void;
  setAIProvider: (provider: AIProvider) => void;
  setIsAILoading: (loading: boolean) => void;
  createAdvisory: () => Advisory;
  submitAdvisory: (id: string) => void;
  acknowledgeAdvisory: (id: string) => void;
  resetBuilder: () => void;
}

const generateAdvisoryId = (year: number, number: number): string => {
  return `OTTO-RESP-${year}-${String(number).padStart(4, '0')}`;
};

export const useOttoResponseStore = create<OttoResponseState>((set, get) => ({
  // Initial state
  isPanelOpen: false,
  trafficSeverity: 'Medium',
  lastUpdated: new Date(),
  drawingMode: 'none',
  drawnZone: null,
  vehiclesInside: 0,
  vehiclesNear: 0,
  confidence: 'Medium',
  recommendations: {
    pauseDispatches: false,
    avoidZoneRouting: false,
    waveBasedRecovery: false,
    waveSize: 5,
    waveIntervalMinutes: 15,
    safeHarborStaging: false,
    keepClearCorridors: false,
  },
  selectedSafeHarbors: [],
  oemNotes: '',
  advisories: [],
  nextAdvisoryNumber: 1,
  aiProvider: 'openai',
  isAILoading: false,
  
  // Actions
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  
  setDrawnZone: (zone) => set({ drawnZone: zone }),
  
  setTrafficSeverity: (severity) => set({ 
    trafficSeverity: severity,
    confidence: severity,
    lastUpdated: new Date()
  }),
  
  updateZoneAnalytics: (inside, near) => set({ 
    vehiclesInside: inside, 
    vehiclesNear: near 
  }),
  
  setRecommendation: (key, value) => set((state) => ({
    recommendations: {
      ...state.recommendations,
      [key]: value,
    },
  })),
  
  toggleSafeHarbor: (harbor) => set((state) => {
    const exists = state.selectedSafeHarbors.find(h => h.id === harbor.id);
    if (exists) {
      return { selectedSafeHarbors: state.selectedSafeHarbors.filter(h => h.id !== harbor.id) };
    }
    if (state.selectedSafeHarbors.length >= 3) {
      return state; // Max 3 harbors
    }
    return { selectedSafeHarbors: [...state.selectedSafeHarbors, harbor] };
  }),
  
  setOemNotes: (notes) => set({ oemNotes: notes }),
  
  setAIProvider: (provider) => set({ aiProvider: provider }),
  
  setIsAILoading: (loading) => set({ isAILoading: loading }),
  
  createAdvisory: () => {
    const state = get();
    const year = new Date().getFullYear();
    const advisory: Advisory = {
      id: generateAdvisoryId(year, state.nextAdvisoryNumber),
      timestamp: new Date(),
      severity: state.trafficSeverity,
      zoneType: state.drawnZone?.type || null,
      zone: state.drawnZone,
      vehiclesInside: state.vehiclesInside,
      vehiclesNear: state.vehiclesNear,
      recommendations: { ...state.recommendations },
      selectedSafeHarbors: [...state.selectedSafeHarbors],
      oemNotes: state.oemNotes,
      status: 'Draft',
    };
    
    set((s) => ({
      advisories: [advisory, ...s.advisories],
      nextAdvisoryNumber: s.nextAdvisoryNumber + 1,
    }));
    
    return advisory;
  },
  
  submitAdvisory: (id) => set((state) => ({
    advisories: state.advisories.map(a => 
      a.id === id ? { ...a, status: 'Submitted' as AdvisoryStatus } : a
    ),
  })),
  
  acknowledgeAdvisory: (id) => set((state) => ({
    advisories: state.advisories.map(a => 
      a.id === id ? { ...a, status: 'Acknowledged' as AdvisoryStatus } : a
    ),
  })),
  
  resetBuilder: () => set({
    drawingMode: 'none',
    drawnZone: null,
    vehiclesInside: 0,
    vehiclesNear: 0,
    recommendations: {
      pauseDispatches: false,
      avoidZoneRouting: false,
      waveBasedRecovery: false,
      waveSize: 5,
      waveIntervalMinutes: 15,
      safeHarborStaging: false,
      keepClearCorridors: false,
    },
    selectedSafeHarbors: [],
    oemNotes: '',
  }),
}));
