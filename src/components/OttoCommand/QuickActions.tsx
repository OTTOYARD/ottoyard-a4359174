// src/components/OttoCommand/QuickActions.tsx
// Streamlined quick action buttons for OttoCommand AI chat interface

import React from "react";
import {
  Activity,
  AlertTriangle,
  Truck,
  BatteryWarning,
  Wrench,
  MapPin,
  Car,
  Target,
  CalendarDays,
  ListOrdered,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  prompt: string;
  isDialog?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

export interface QuickActionsProps {
  onSelect: (action: QuickAction) => void;
  disabled?: boolean;
  className?: string;
  currentCity?: string;
  mode?: "av" | "ev";
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAMLINED QUICK ACTIONS - 6 Essential Actions
// ═══════════════════════════════════════════════════════════════════════════════

export const quickActions: QuickAction[] = [
  {
    id: "fleet-status",
    label: "Fleet Status",
    icon: Activity,
    description: "Real-time fleet overview",
    prompt: "What's the current fleet status? Show vehicles by status, average SOC, and any critical alerts.",
  },
  {
    id: "critical-alerts",
    label: "Critical Alerts",
    icon: AlertTriangle,
    description: "Urgent items needing attention",
    prompt: "Show all critical alerts: vehicles with SOC below 20%, incidents requiring attention, and high-risk maintenance items.",
  },
  {
    id: "ottow-dispatch",
    label: "OTTOW Dispatch",
    icon: Truck,
    description: "Roadside assistance dispatch",
    prompt: "ottow_dispatch",
    isDialog: true,
  },
  {
    id: "charging-predictions",
    label: "Charging Needs",
    icon: BatteryWarning,
    description: "Vehicles needing charge soon",
    prompt: "Predict which vehicles will need charging in the next 4 hours. Show urgency levels and recommended actions.",
  },
  {
    id: "maintenance-risks",
    label: "Maintenance Risks",
    icon: Wrench,
    description: "Predictive maintenance alerts",
    prompt: "Identify vehicles with elevated maintenance risk. Show risk scores, affected components, and recommended scheduling.",
  },
  {
    id: "depot-availability",
    label: "Depot Resources",
    icon: MapPin,
    description: "Check depot availability",
    prompt: "Show depot resource availability across all locations. Include charging stalls, maintenance bays, and current utilization.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EV-SPECIFIC QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const evQuickActions: QuickAction[] = [
  {
    id: "ev-vehicle-status",
    label: "Vehicle Status",
    icon: Car,
    description: "SOC, health, stall, charging ETA",
    prompt: "What's my vehicle status? Show current SOC, health score, charging status, stall assignment, and estimated range.",
  },
  {
    id: "ev-book-amenity",
    label: "Book Amenity",
    icon: Target,
    description: "Reserve sim golf, cowork, pod",
    prompt: "What amenities are available right now? Show sim golf bays, cowork tables, and privacy pods with open time slots.",
  },
  {
    id: "ev-schedule-service",
    label: "Schedule Service",
    icon: CalendarDays,
    description: "Detailing, tire rotation, maintenance",
    prompt: "What services are available to schedule? Show my upcoming maintenance predictions and let me book a service.",
  },
  {
    id: "ev-depot-queue",
    label: "Depot Queue",
    icon: ListOrdered,
    description: "Stall position, wait times, stages",
    prompt: "Show my depot queue status. What stage is my vehicle at, what's the current stall info, and estimated completion time?",
  },
  {
    id: "ev-tow-request",
    label: "Tow Request",
    icon: Truck,
    description: "Request OTTOW pickup",
    prompt: "I need to request an OTTOW tow pickup for my vehicle from my home address to my preferred depot.",
    isDialog: true,
  },
  {
    id: "ev-billing",
    label: "Billing Summary",
    icon: Receipt,
    description: "Charges, membership, reservations",
    prompt: "Show my account summary including membership tier, recent service charges, and upcoming reservations.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const QuickActionButton: React.FC<{
  action: QuickAction;
  onClick: () => void;
  disabled?: boolean;
}> = ({ action, onClick, disabled }) => {
  const Icon = action.icon;

  return (
    <Button
      variant={action.variant || "outline"}
      size="sm"
      className="h-auto p-2 sm:p-3 flex flex-col items-center space-y-1 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
      onClick={onClick}
      disabled={disabled}
      title={action.description}
    >
      <Icon className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
      <span className="text-xs text-center leading-tight">{action.label}</span>
    </Button>
  );
};

export const QuickActionsGrid: React.FC<QuickActionsProps> = ({
  onSelect,
  disabled,
  className,
  currentCity,
  mode = "av",
}) => {
  const actions = mode === "ev" ? evQuickActions : quickActions;

  const handleSelect = (action: QuickAction) => {
    if (action.isDialog && action.id === "ottow-dispatch" && currentCity) {
      onSelect({
        ...action,
        prompt: `I need to dispatch OTTOW in ${currentCity}`
      });
    } else {
      onSelect(action);
    }
  };

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2", className)}>
      {actions.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          onClick={() => handleSelect(action)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT-AWARE SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface SuggestedActionsProps {
  fleetMetrics?: {
    lowBatteryCount?: number;
    criticalBatteryCount?: number;
    activeIncidents?: number;
    pendingIncidents?: number;
  };
  onSelect: (action: QuickAction) => void;
  className?: string;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  fleetMetrics,
  onSelect,
  className
}) => {
  // Determine top 2-3 suggested actions based on fleet state
  const suggestions: QuickAction[] = [];

  if (fleetMetrics) {
    // Critical battery = highest priority
    if ((fleetMetrics.criticalBatteryCount ?? 0) > 0) {
      const action = quickActions.find(a => a.id === "critical-alerts");
      if (action) suggestions.push(action);
    }

    // Active incidents = high priority
    if ((fleetMetrics.activeIncidents ?? 0) > 0 || (fleetMetrics.pendingIncidents ?? 0) > 0) {
      const action = quickActions.find(a => a.id === "ottow-dispatch");
      if (action && suggestions.length < 3) suggestions.push(action);
    }

    // Low battery vehicles = suggest charging predictions
    if ((fleetMetrics.lowBatteryCount ?? 0) > 0) {
      const action = quickActions.find(a => a.id === "charging-predictions");
      if (action && suggestions.length < 3) suggestions.push(action);
    }
  }

  // Default if no specific needs
  if (suggestions.length === 0) {
    const fleetStatus = quickActions.find(a => a.id === "fleet-status");
    if (fleetStatus) suggestions.push(fleetStatus);
  }

  if (suggestions.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">Suggested:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map(action => (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onSelect(action)}
          >
            <action.icon className="h-3 w-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsGrid;
