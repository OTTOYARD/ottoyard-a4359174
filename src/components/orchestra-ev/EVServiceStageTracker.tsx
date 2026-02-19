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
                {/* Icon */}
                {stage.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                ) : stage.status === "in_progress" ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                )}
                {/* Label */}
                <span className={`text-[10px] mt-1 max-w-[80px] leading-tight ${
                  stage.status === "completed" ? "text-success" :
                  stage.status === "in_progress" ? "text-primary font-medium" :
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
                <div className={`flex-1 h-[2px] mt-2.5 mx-1 rounded-full ${
                  stage.status === "completed" ? "bg-success" : "bg-border/50"
                }`} />
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
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                ) : stage.status === "in_progress" ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                {!isLast && (
                  <div className={`w-[2px] flex-1 my-1 rounded-full ${
                    stage.status === "completed" ? "bg-success" : "bg-border/50"
                  }`} />
                )}
              </div>

              <div className="pb-3">
                <p className={`text-xs ${
                  stage.status === "completed" ? "text-success" :
                  stage.status === "in_progress" ? "text-primary font-medium" :
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
