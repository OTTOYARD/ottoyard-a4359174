import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Options = {
  enabled?: boolean;
  cityName?: string;
  onChange: (payload: { table: string; eventType: string }) => void;
  debounceMs?: number;
};

export function useOTTOQRealtime({ enabled = true, cityName, onChange, debounceMs = 500 }: Options) {
  const timeoutRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const debouncedHandler = useCallback((table: string, eventType: string) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      onChangeRef.current({ table, eventType });
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `ottoq-realtime${cityName ? `-${cityName}` : ""}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const tables = [
      "ottoq_vehicles",
      "ottoq_jobs",
      "ottoq_resources",
      "ottoq_movement_queue",
      "ottoq_simulator_state",
      "ottoq_events"
    ];

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          debouncedHandler(table, (payload as { eventType?: string }).eventType || "UNKNOWN");
        }
      );
    }

    channel.subscribe();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [enabled, cityName, debounceMs, debouncedHandler]);
}
