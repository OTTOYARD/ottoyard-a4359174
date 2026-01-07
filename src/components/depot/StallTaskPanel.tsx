import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ClipboardCheck, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskChecklistItem } from "./TaskChecklistItem";
import { MovementQueueButton } from "./MovementQueueButton";
import { getTaskConfigForResource, areAllTasksComplete } from "@/constants/stallTasks";

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
  
  const taskConfig = getTaskConfigForResource(resourceType);
  
  useEffect(() => {
    if (isOpen && jobId) {
      fetchConfirmations();
    }
  }, [isOpen, jobId, resourceId]);

  const fetchConfirmations = async () => {
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
  };

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

      // Refresh confirmations
      await fetchConfirmations();
      onTaskUpdate?.();
      
      if (taskKey === taskConfig?.deploymentTaskKey && confirmed) {
        toast.success("Vehicle confirmed for deployment!");
      }
    } catch (error) {
      console.error("Failed to confirm task:", error);
      toast.error("Failed to save confirmation");
      throw error;
    }
  };

  if (!taskConfig || !jobId) {
    return null;
  }

  const confirmedTasks = new Set(
    confirmations.filter((c) => c.confirmed_at).map((c) => c.task_key)
  );
  const allComplete = areAllTasksComplete(resourceType, confirmedTasks);
  const completedCount = confirmedTasks.size;
  const totalTasks = taskConfig.tasks.filter((t) => !t.requiresInput || t.key === "maintenance_type").length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-between text-xs h-7 px-2",
            allComplete && "text-success"
          )}
        >
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="w-3 h-3" />
            Task Confirmation
          </span>
          <span className="flex items-center gap-1.5">
            {allComplete ? (
              <Badge variant="outline" className="h-5 text-[10px] border-success/40 text-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
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
              {taskConfig.tasks.map((task) => {
                const confirmation = confirmations.find((c) => c.task_key === task.key);
                return (
                  <TaskChecklistItem
                    key={task.key}
                    task={task}
                    isConfirmed={!!confirmation?.confirmed_at}
                    confirmedAt={confirmation?.confirmed_at || undefined}
                    metadata={(confirmation?.metadata_jsonb as Record<string, unknown>) || undefined}
                    onConfirm={handleConfirmTask}
                  />
                );
              })}
              
              {vehicleId && (
                <>
                  <Separator className="my-2" />
                  <MovementQueueButton
                    vehicleId={vehicleId}
                    currentResourceId={resourceId}
                    currentResourceType={resourceType}
                    depotId={depotId}
                    onQueued={onTaskUpdate}
                  />
                </>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
