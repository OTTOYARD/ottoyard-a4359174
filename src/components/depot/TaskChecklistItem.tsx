import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDefinition } from "@/constants/stallTasks";

interface TaskChecklistItemProps {
  task: TaskDefinition;
  isConfirmed: boolean;
  confirmedAt?: string;
  metadata?: Record<string, unknown>;
  onConfirm: (taskKey: string, value: boolean, metadata?: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

export function TaskChecklistItem({
  task,
  isConfirmed,
  confirmedAt,
  metadata,
  onConfirm,
  disabled = false,
}: TaskChecklistItemProps) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState<string>(
    (metadata?.[task.key] as string) || ""
  );

  const handleCheckChange = async (checked: boolean) => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      const taskMetadata = task.requiresInput ? { [task.key]: inputValue } : undefined;
      await onConfirm(task.key, checked, taskMetadata);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputConfirm = async () => {
    if (loading || disabled || !inputValue) return;
    
    setLoading(true);
    try {
      await onConfirm(task.key, true, { [task.key]: inputValue });
    } finally {
      setLoading(false);
    }
  };

  // For input-type tasks, show the input field
  if (task.requiresInput) {
    return (
      <div className="space-y-2 p-2 rounded-md bg-muted/30">
        <Label className="text-xs font-medium">{task.label}</Label>
        {task.inputType === "select" && task.options ? (
          <Select
            value={inputValue}
            onValueChange={(value) => {
              handleInputChange(value);
              // Auto-confirm on select
              setLoading(true);
              onConfirm(task.key, true, { [task.key]: value }).finally(() => setLoading(false));
            }}
            disabled={disabled || loading}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {task.options.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputConfirm}
              onKeyDown={(e) => e.key === "Enter" && handleInputConfirm()}
              placeholder={task.description}
              className="h-8 text-xs"
              disabled={disabled || loading}
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        )}
        {isConfirmed && confirmedAt && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3 text-success" />
            {new Date(confirmedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    );
  }

  // Standard checkbox task
  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md transition-colors",
        isConfirmed ? "bg-success/10" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={isConfirmed}
            onCheckedChange={handleCheckChange}
            disabled={disabled}
            className="data-[state=checked]:bg-success data-[state=checked]:border-success"
          />
        )}
        <div className="flex flex-col">
          <span className={cn("text-xs font-medium", isConfirmed && "text-success")}>
            {task.label}
          </span>
          {task.description && !isConfirmed && (
            <span className="text-[10px] text-muted-foreground">{task.description}</span>
          )}
        </div>
      </div>
      {isConfirmed && confirmedAt && (
        <span className="text-[10px] text-muted-foreground">
          {new Date(confirmedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}
