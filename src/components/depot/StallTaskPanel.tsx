import { useState, useEffect, useCallback } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ClipboardCheck, CheckCircle2, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskChecklistItem } from "./TaskChecklistItem";
import { MovementQueueButton } from "./MovementQueueButton";
import { getTaskConfigForResource } from "@/constants/stallTasks";

interface TaskConfirmation {
  id: string;
  task_key: string;
  confirmed_at: string | null;
  metadata_jsonb: Record<string, unknown> | null | unknown;
}

interface StallTaskPanelProps {
  resourceId: string;
  resourceType: string;
  resourceIndex: number;
  jobId: string | null;
  vehicleId?: string;
  depotId: string;
  onTaskUpdate?: () => void;
}

export function StallTaskPanel({
  resourceId,
  resourceType,
  resourceIndex,
  jobId,
  vehicleId,
  depotId,
  onTaskUpdate,
}: StallTaskPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmations, setConfirmations] = useState<TaskConfirmation[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);
  
  const taskConfig = getTaskConfigForResource(resourceType);
  
  // Get tasks excluding the deployment task (shown as separate button)
  const checklistTasks = taskConfig?.tasks.filter(t => t.key !== taskConfig.deploymentTaskKey) || [];
  const deploymentTask = taskConfig?.tasks.find(t => t.key === taskConfig?.deploymentTaskKey);
  
  useEffect(() => {
    if (isOpen && jobId) {
      fetchConfirmations();
    }
  }, [isOpen, jobId, resourceId]);

  const fetchConfirmations = useCallback(async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ottoq_task_confirmations")
        .select("id, task_key, confirmed_at, metadata_jsonb")
        .eq("job_id", jobId)
        .eq("resource_id", resourceId);

      if (error) throw error;
      setConfirmations((data || []).map(d => ({
        ...d,
        metadata_jsonb: d.metadata_jsonb as Record<string, unknown> | null
      })));
    } catch (error) {
      console.error("Failed to fetch confirmations:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId, resourceId]);

  const handleConfirmTask = async (
    taskKey: string,
    confirmed: boolean,
    metadata?: Record<string, unknown>
  ) => {
    if (!jobId) return;

    try {
      const { error } = await supabase.functions.invoke("ottoq-task-confirm", {
        body: {
          job_id: jobId,
          resource_id: resourceId,
          task_key: taskKey,
          confirmed,
          metadata,
        },
      });

      if (error) throw error;

      // Update local state immediately without full refresh
      setConfirmations(prev => {
        if (confirmed) {
          // Add or update confirmation
          const existing = prev.find(c => c.task_key === taskKey);
          if (existing) {
            return prev.map(c => 
              c.task_key === taskKey 
                ? { ...c, confirmed_at: new Date().toISOString(), metadata_jsonb: metadata || c.metadata_jsonb }
                : c
            );
          }
          return [...prev, { 
            id: crypto.randomUUID(), 
            task_key: taskKey, 
            confirmed_at: new Date().toISOString(),
            metadata_jsonb: metadata || null
          }];
        } else {
          // Remove confirmation
          return prev.map(c => 
            c.task_key === taskKey ? { ...c, confirmed_at: null } : c
          );
        }
      });
    } catch (error) {
      console.error("Failed to confirm task:", error);
      toast.error("Failed to save confirmation");
      throw error;
    }
  };

  const handleDeployment = async () => {
    if (!jobId || !deploymentTask) return;
    
    setDeployLoading(true);
    try {
      await handleConfirmTask(deploymentTask.key, true);
      toast.success("Vehicle confirmed for deployment!");
      // Trigger parent refresh after deployment
      onTaskUpdate?.();
    } catch (error) {
      // Error already handled in handleConfirmTask
    } finally {
      setDeployLoading(false);
    }
  };

  if (!taskConfig || !jobId) {
    return null;
  }

  const confirmedTasks = new Set(
    confirmations.filter((c) => c.confirmed_at).map((c) => c.task_key)
  );
  
  // Count only checklist tasks (excluding deployment)
  const completedCount = checklistTasks.filter(t => confirmedTasks.has(t.key)).length;
  const totalTasks = checklistTasks.filter((t) => !t.requiresInput || t.key === "maintenance_type").length;
  const allChecklistComplete = completedCount === totalTasks;
  const isDeployed = confirmedTasks.has(taskConfig.deploymentTaskKey);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-between text-xs h-7 px-2",
            isDeployed && "text-success"
          )}
        >
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="w-3 h-3" />
            Task Confirmation
          </span>
          <span className="flex items-center gap-1.5">
            {isDeployed ? (
              <Badge variant="outline" className="h-5 text-[10px] border-success/40 text-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Deployed
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 text-[10px]">
                {completedCount}/{totalTasks}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="space-y-1 rounded-md border border-border/50 bg-background/50 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Checklist Tasks */}
              {checklistTasks.map((task) => {
                const confirmation = confirmations.find((c) => c.task_key === task.key);
                return (
                  <TaskChecklistItem
                    key={task.key}
                    task={task}
                    isConfirmed={!!confirmation?.confirmed_at}
                    confirmedAt={confirmation?.confirmed_at || undefined}
                    metadata={(confirmation?.metadata_jsonb as Record<string, unknown>) || undefined}
                    onConfirm={handleConfirmTask}
                    disabled={isDeployed}
                  />
                );
              })}
              
              <Separator className="my-2" />
              
              {/* Confirm Deployment Button */}
              {deploymentTask && (
                <Button
                  variant={isDeployed ? "outline" : "default"}
                  size="sm"
                  className={cn(
                    "w-full text-xs h-8",
                    isDeployed && "border-success/40 text-success bg-success/10"
                  )}
                  onClick={handleDeployment}
                  disabled={!allChecklistComplete || isDeployed || deployLoading}
                >
                  {deployLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : isDeployed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Rocket className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isDeployed ? "Deployed" : deploymentTask.label}
                </Button>
              )}
              
              {/* Queue for Service Dropdown */}
              {vehicleId && (
                <MovementQueueButton
                  vehicleId={vehicleId}
                  currentResourceId={resourceId}
                  currentResourceType={resourceType}
                  depotId={depotId}
                  onQueued={onTaskUpdate}
                  disabled={isDeployed}
                />
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
