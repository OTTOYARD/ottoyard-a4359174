// src/components/OttoCommand/QuickActions.tsx
// Quick action buttons for OttoCommand AI chat interface

import React from "react";
import {
  BarChart3,
  AlertTriangle,
  PieChart,
  ShieldAlert,
  Truck,
  FileText,
  BatteryWarning,
  Wrench,
  ListTodo,
  Calendar,
  CalendarClock,
  Layers,
  Zap,
  Activity,
  TrendingUp,
  Bot
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
  category: "analysis" | "triage" | "automation" | "scheduling";
  prompt: string;
  hotkey?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

export interface QuickActionsProps {
  onSelect: (action: QuickAction) => void;
  disabled?: boolean;
  compact?: boolean;
  showCategories?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS DATA
// ═══════════════════════════════════════════════════════════════════════════════

export const quickActions: QuickAction[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // FLEET ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "fleet-snapshot",
    label: "Fleet Snapshot",
    icon: BarChart3,
    description: "Comprehensive fleet health overview",
    category: "analysis",
    prompt: "Generate a comprehensive fleet snapshot including vehicle health, charging status, active incidents, utilization metrics, and key alerts.",
    hotkey: "F1"
  },
  {
    id: "critical-alerts",
    label: "Critical Alerts",
    icon: AlertTriangle,
    description: "View all critical and high-priority alerts",
    category: "analysis",
    prompt: "Show all critical alerts: vehicles with SOC below 20%, overdue maintenance, active incidents requiring attention, and any detected anomalies.",
    hotkey: "F2",
    variant: "destructive"
  },
  {
    id: "utilization-report",
    label: "Utilization Report",
    icon: PieChart,
    description: "Depot and fleet utilization metrics",
    category: "analysis",
    prompt: "Generate a utilization report comparing all depots. Include charging stall usage, maintenance bay occupancy, vehicle distribution, and efficiency metrics."
  },
  {
    id: "performance-comparison",
    label: "Compare Cities",
    icon: TrendingUp,
    description: "Compare metrics across cities",
    category: "analysis",
    prompt: "Compare fleet performance across Nashville, Austin, and LA. Include utilization, average SOC, safety scores, and revenue metrics."
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INCIDENT TRIAGE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "incident-triage",
    label: "Incident Triage",
    icon: ShieldAlert,
    description: "Smart incident prioritization",
    category: "triage",
    prompt: "Triage all active incidents by priority. Show status, severity, location, and recommended actions for each incident.",
    hotkey: "F3"
  },
  {
    id: "ottow-dispatch",
    label: "OTTOW Dispatch",
    icon: Truck,
    description: "Quick OTTOW roadside dispatch",
    category: "triage",
    prompt: "I need to dispatch OTTOW roadside assistance. Show me the dispatch options by city with available response vehicles.",
    hotkey: "F4",
    variant: "secondary"
  },
  {
    id: "incident-summary",
    label: "Incident Summary",
    icon: FileText,
    description: "Summary of recent incidents",
    category: "triage",
    prompt: "Summarize all incidents from the last 24 hours. Group by type, status, city, and show average resolution time."
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PREDICTIVE / AUTOMATION
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "predict-charging",
    label: "Charging Predictions",
    icon: BatteryWarning,
    description: "Vehicles needing charge soon",
    category: "automation",
    prompt: "Predict which vehicles will need charging in the next 4 hours. Include current SOC, predicted SOC, urgency level, and recommended charge scheduling.",
    hotkey: "F5"
  },
  {
    id: "predict-maintenance",
    label: "Maintenance Risks",
    icon: Wrench,
    description: "Predictive maintenance alerts",
    category: "automation",
    prompt: "Identify vehicles with elevated maintenance risk based on telemetry, mileage, and component health patterns. Show risk scores, categories, and recommended actions.",
    hotkey: "F6"
  },
  {
    id: "auto-queue",
    label: "Smart Auto-Queue",
    icon: ListTodo,
    description: "Auto-queue vehicles for OTTO-Q",
    category: "automation",
    prompt: "Analyze the fleet and suggest vehicles to auto-queue for charging or maintenance based on SOC levels and risk scores. Show a dry-run preview before any execution."
  },
  {
    id: "optimize-schedule",
    label: "Optimize Schedule",
    icon: Zap,
    description: "Optimize depot operations schedule",
    category: "automation",
    prompt: "Optimize the charging and maintenance schedule across all depots for maximum throughput and minimum wait times. Show current utilization and improvement recommendations."
  },
  {
    id: "anomaly-detection",
    label: "Detect Anomalies",
    icon: Activity,
    description: "Find fleet anomalies",
    category: "automation",
    prompt: "Detect anomalies in fleet telemetry and operations. Check for unusual SOC drain, location issues, sensor drift, and performance drops."
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULING
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "schedule-maintenance",
    label: "Schedule Maintenance",
    icon: CalendarClock,
    description: "Schedule vehicle maintenance",
    category: "scheduling",
    prompt: "Help me schedule maintenance. Show which vehicles are due or approaching their maintenance windows, sorted by urgency."
  },
  {
    id: "bulk-operations",
    label: "Bulk Operations",
    icon: Layers,
    description: "Schedule multiple vehicles at once",
    category: "scheduling",
    prompt: "I need to schedule bulk operations. Show me vehicles grouped by recommended action (charging, maintenance, detailing) and let me queue them in batch."
  },
  {
    id: "depot-availability",
    label: "Depot Availability",
    icon: Calendar,
    description: "Check depot resource availability",
    category: "scheduling",
    prompt: "Show depot availability across all locations. Include charging stalls, maintenance bays, and staging areas with current occupancy and upcoming reservations."
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const categoryConfig = {
  analysis: {
    label: "Fleet Analysis",
    icon: BarChart3,
    color: "text-blue-600"
  },
  triage: {
    label: "Incident Triage",
    icon: ShieldAlert,
    color: "text-red-600"
  },
  automation: {
    label: "Predictions & Automation",
    icon: Bot,
    color: "text-purple-600"
  },
  scheduling: {
    label: "Scheduling",
    icon: Calendar,
    color: "text-green-600"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const QuickActionButton: React.FC<{
  action: QuickAction;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}> = ({ action, onClick, disabled, compact }) => {
  const Icon = action.icon;

  if (compact) {
    return (
      <Button
        variant={action.variant || "outline"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="h-8 px-3 text-xs"
        title={action.description}
      >
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {action.label}
        {action.hotkey && (
          <span className="ml-1.5 text-[10px] opacity-50">{action.hotkey}</span>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={action.variant || "outline"}
      onClick={onClick}
      disabled={disabled}
      className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left hover:bg-muted/50"
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{action.label}</span>
        {action.hotkey && (
          <span className="ml-auto text-[10px] opacity-50 bg-muted px-1.5 py-0.5 rounded">
            {action.hotkey}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{action.description}</span>
    </Button>
  );
};

export const QuickActionsGrid: React.FC<QuickActionsProps> = ({
  onSelect,
  disabled,
  compact,
  showCategories = true,
  className
}) => {
  const categories = showCategories
    ? Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>
    : null;

  if (categories) {
    return (
      <div className={cn("space-y-4", className)}>
        {categories.map(category => {
          const config = categoryConfig[category];
          const categoryActions = quickActions.filter(a => a.category === category);
          const CategoryIcon = config.icon;

          return (
            <div key={category} className="space-y-2">
              <div className={cn("flex items-center gap-2 text-sm font-medium", config.color)}>
                <CategoryIcon className="h-4 w-4" />
                {config.label}
              </div>
              <div className={cn(
                "grid gap-2",
                compact ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
              )}>
                {categoryActions.map(action => (
                  <QuickActionButton
                    key={action.id}
                    action={action}
                    onClick={() => onSelect(action)}
                    disabled={disabled}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-2",
      compact ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      className
    )}>
      {quickActions.map(action => (
        <QuickActionButton
          key={action.id}
          action={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          compact={compact}
        />
      ))}
    </div>
  );
};

// Compact horizontal list for toolbar use
export const QuickActionBar: React.FC<QuickActionsProps & { maxActions?: number }> = ({
  onSelect,
  disabled,
  maxActions = 6,
  className
}) => {
  const priorityActions = quickActions
    .filter(a => a.hotkey) // Only show hotkey actions
    .slice(0, maxActions);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {priorityActions.map(action => (
        <QuickActionButton
          key={action.id}
          action={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          compact
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useQuickActionHotkeys = (
  onSelect: (action: QuickAction) => void,
  enabled = true
) => {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for F1-F6 keys
      if (e.key.startsWith("F") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const action = quickActions.find(a => a.hotkey === e.key);
        if (action) {
          e.preventDefault();
          onSelect(action);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelect, enabled]);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTED ACTIONS COMPONENT (Context-aware)
// ═══════════════════════════════════════════════════════════════════════════════

interface SuggestedActionsProps {
  fleetMetrics?: {
    lowBatteryCount: number;
    activeIncidents: number;
    maintenanceDue: number;
  };
  onSelect: (action: QuickAction) => void;
  className?: string;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  fleetMetrics,
  onSelect,
  className
}) => {
  // Determine suggested actions based on fleet state
  const suggestions: QuickAction[] = [];

  if (fleetMetrics) {
    if (fleetMetrics.lowBatteryCount > 0) {
      suggestions.push(quickActions.find(a => a.id === "predict-charging")!);
    }
    if (fleetMetrics.activeIncidents > 0) {
      suggestions.push(quickActions.find(a => a.id === "incident-triage")!);
    }
    if (fleetMetrics.maintenanceDue > 0) {
      suggestions.push(quickActions.find(a => a.id === "predict-maintenance")!);
    }
  }

  // Default suggestions if no specific needs
  if (suggestions.length === 0) {
    suggestions.push(
      quickActions.find(a => a.id === "fleet-snapshot")!,
      quickActions.find(a => a.id === "critical-alerts")!
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">Suggested actions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.filter(Boolean).slice(0, 3).map(action => (
          <QuickActionButton
            key={action.id}
            action={action}
            onClick={() => onSelect(action)}
            compact
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActionsGrid;
