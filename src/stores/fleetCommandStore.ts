import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface FleetCommand {
  id: string;
  commandType: string;
  status: string;
  city: string;
  zone: any;
  targetVehicleIds: string[];
  affectedVehicleCount: number;
  reason: string;
  urgency: string;
  issuedBy: string;
  linkedAdvisoryId: string | null;
  linkedEventId: string | null;
  parameters: any;
  result: any;
  issuedAt: string;
  acknowledgedAt: string | null;
  completedAt: string | null;
}

function mapRow(row: any): FleetCommand {
  return {
    id: row.id,
    commandType: row.command_type,
    status: row.status,
    city: row.city,
    zone: row.zone,
    targetVehicleIds: row.target_vehicle_ids ?? [],
    affectedVehicleCount: row.affected_vehicle_count ?? 0,
    reason: row.reason,
    urgency: row.urgency,
    issuedBy: row.issued_by,
    linkedAdvisoryId: row.linked_advisory_id,
    linkedEventId: row.linked_event_id,
    parameters: row.parameters,
    result: row.result,
    issuedAt: row.issued_at,
    acknowledgedAt: row.acknowledged_at,
    completedAt: row.completed_at,
  };
}

interface FleetCommandState {
  commands: FleetCommand[];
  fetchCommands: () => Promise<void>;
  createCommand: (cmd: Partial<Record<string, any>>) => Promise<FleetCommand | null>;
  subscribeToRealtime: () => () => void;
}

export const useFleetCommandStore = create<FleetCommandState>((set, get) => ({
  commands: [],

  fetchCommands: async () => {
    const { data } = await supabase
      .from('fleet_commands')
      .select('*')
      .not('status', 'in', '("completed","cancelled")')
      .order('issued_at', { ascending: false })
      .limit(50);

    if (data) set({ commands: data.map(mapRow) });
  },

  createCommand: async (cmd) => {
    const { data, error } = await supabase
      .from('fleet_commands')
      .insert([cmd] as any)
      .select()
      .single();

    if (error || !data) return null;
    const mapped = mapRow(data);
    set((s) => ({ commands: [mapped, ...s.commands] }));
    return mapped;
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel(`fleet-commands-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_commands' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          set((s) => ({ commands: [mapRow(payload.new), ...s.commands] }));
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapRow(payload.new);
          set((s) => ({
            commands: ['completed', 'cancelled'].includes(updated.status)
              ? s.commands.filter((c) => c.id !== updated.id)
              : s.commands.map((c) => (c.id === updated.id ? updated : c)),
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));
