import React from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { ServiceStage } from "@/lib/orchestra-ev/types";

interface EVServiceStageTrackerProps {
  stages: ServiceStage[];
}

export const EVServiceStageTracker: React.FC<EVServiceStageTrackerProps> = ({ stages }) => {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-start w-full">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center text-center min-w-[80px]">
                {/* Icon with premium container */}
                {stage.status === "completed" ? (
                  <div className="bg-success/20 rounded-full p-1 shadow-[0_0_8px_hsl(var(--success)/0.3)]">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  </div>
                ) : stage.status === "in_progress" ? (
                  <div className="bg-primary/20 rounded-full p-1 animate-pulse-ring">
                    <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  </div>
                ) : (
                  <div className="rounded-full p-1">
                    <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                )}
                {/* Label */}
                <span className={`text-xs font-medium mt-1.5 max-w-[80px] leading-tight ${
                  stage.status === "completed" ? "text-success" :
                  stage.status === "in_progress" ? "text-primary font-semibold" :
                  "text-muted-foreground/50"
                }`}>
                  {stage.name}
                </span>
                {/* Timestamp */}
                {stage.timestamp && (
                  <span className="text-[9px] text-muted-foreground mt-0.5">
                    {new Date(stage.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className={`flex-1 h-[3px] mt-3 mx-1 rounded-full ${
                  stage.status === "completed"
                    ? "bg-gradient-to-r from-success to-success/60"
                    : "bg-muted/30"
                }`}
                style={stage.status !== "completed" ? {
                  backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.15) 0px, hsl(var(--muted-foreground) / 0.15) 4px, transparent 4px, transparent 8px)"
                } : undefined}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-0">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          return (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                {stage.status === "completed" ? (
                  <div className="bg-success/20 rounded-full p-1 shadow-[0_0_8px_hsl(var(--success)/0.3)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  </div>
                ) : stage.status === "in_progress" ? (
                  <div className="bg-primary/20 rounded-full p-1 animate-pulse-ring">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
                  </div>
                ) : (
                  <div className="rounded-full p-1">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                )}
                {!isLast && (
                  <div
                    className={`w-[3px] flex-1 my-1 rounded-full ${
                      stage.status === "completed"
                        ? "bg-gradient-to-b from-success to-success/60"
                        : "bg-muted/30"
                    }`}
                  />
                )}
              </div>

              <div className="pb-3">
                <p className={`text-xs font-medium ${
                  stage.status === "completed" ? "text-success" :
                  stage.status === "in_progress" ? "text-primary font-semibold" :
                  "text-muted-foreground/50"
                }`}>
                  {stage.name}
                </p>
                {stage.timestamp && (
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(stage.timestamp).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {stage.estimatedCompletion && stage.status === "in_progress" && (
                  <p className="text-[10px] text-primary/70">
                    Est. complete:{" "}
                    {new Date(stage.estimatedCompletion).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
