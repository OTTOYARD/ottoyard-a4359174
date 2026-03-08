// src/hooks/useOttoResponseBridge.ts
// Bridge between Intelligence Store, OTTOCommand, and OTTO-Response

import { useEffect, useRef, useCallback } from "react";
import { useIntelligenceStore, IntelligenceEvent } from "@/stores/intelligenceStore";
import { useOttoCommandStore } from "@/stores/ottoCommandStore";
import { useOttoResponseStore } from "@/stores/ottoResponseStore";

export function useOttoResponseBridge() {
  const events = useIntelligenceStore((s) => s.events);
  const pushAlert = useOttoCommandStore((s) => s.pushAlert);
  const { setDrawnZone, setTrafficSeverity, setOemNotes, setRecommendation } = useOttoResponseStore();
  const openPanel = useOttoResponseStore((s) => s.openPanel);

  const seenEventIds = useRef<Set<string>>(new Set());

  // Watch for new high-threat events → push proactive alerts to OttoCommand
  useEffect(() => {
    const highThreatEvents = events.filter(
      (e) => e.threatScore >= 60 && !seenEventIds.current.has(e.id)
    );

    for (const event of highThreatEvents) {
      seenEventIds.current.add(event.id);
      pushAlert({
        severity: event.severity === "critical" ? "critical" : "high",
        title: event.title,
        message: `${event.city || "Unknown"} — Threat score ${event.threatScore}/100. ${event.vehiclesAffected} vehicles affected.`,
        suggestedAction: "View threat details",
        suggestedPrompt: `Get the intelligence summary for ${event.city || "all cities"} and show me the '${event.title}' threat details with recommended actions`,
        source: "incident",
      });
    }
  }, [events, pushAlert]);

  // Open O-R panel pre-populated with event data
  const openFromEvent = useCallback(
    (event: IntelligenceEvent) => {
      if (event.locationLat && event.locationLng) {
        setDrawnZone({
          type: "radius",
          center: { lat: event.locationLat, lng: event.locationLng },
          radiusMiles: event.radiusMiles || 2,
        });
      }

      const severity =
        event.severity === "critical" || event.severity === "high"
          ? "High"
          : event.severity === "medium"
          ? "Medium"
          : "Low";
      setTrafficSeverity(severity as any);

      // Apply recommendations via individual setRecommendation calls
      if (event.autoRecommendations?.length) {
        for (const rec of event.autoRecommendations) {
          if (rec === "pauseDispatches") setRecommendation("pauseDispatches", true);
          if (rec === "avoidZoneRouting") setRecommendation("avoidZoneRouting", true);
        }
      }

      setOemNotes(
        `[Intelligence Event] ${event.title}\nSource: ${event.source}\nCity: ${event.city || "N/A"}\nThreat Score: ${event.threatScore}/100\n${event.description || ""}`
      );

      openPanel();
    },
    [setDrawnZone, setTrafficSeverity, setRecommendation, setOemNotes, openPanel]
  );

  // Handle OttoCommand tool results that reference O-R
  const handleToolResult = useCallback(
    (result: any) => {
      if (result?.action === "open_otto_response") {
        if (result.eventId) {
          const currentEvents = useIntelligenceStore.getState().events;
          const event = currentEvents.find((e) => e.id === result.eventId);
          if (event) {
            openFromEvent(event);
            return;
          }
        }
        openPanel();
      }
    },
    [openFromEvent, openPanel]
  );

  return { openFromEvent, handleToolResult };
}
