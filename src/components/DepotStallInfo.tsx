import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Wrench, Sparkles, Battery, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Resource {
  type: string;
  index: number;
  status: string;
  label: string;
  job_id: string | null;
}

interface DepotResources {
  depot_id: string;
  depot_name: string;
  city: string;
  branding: string;
  resources: Resource[];
  updated_at: string;
}

interface DepotStallInfoProps {
  depotId: string;
}

export const DepotStallInfo = ({ depotId }: DepotStallInfoProps) => {
  const [depotResources, setDepotResources] = useState<DepotResources | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (depotId) {
      fetchDepotResources(depotId);
    }
  }, [depotId]);

  const fetchDepotResources = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `ottoq-depots-resources/${id}`,
        { method: "GET" }
      );

      if (error) throw error;
      setDepotResources(data);
    } catch (error) {
      console.error("Error fetching depot resources:", error);
      toast.error("Failed to load stall information");
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "CHARGE_STALL":
        return <Zap className="w-3 h-3" />;
      case "MAINTENANCE_BAY":
        return <Wrench className="w-3 h-3" />;
      case "CLEAN_DETAIL_STALL":
        return <Sparkles className="w-3 h-3" />;
      default:
        return <Battery className="w-3 h-3" />;
    }
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "border-success/40 bg-success/5 text-success";
      case "OCCUPIED":
        return "border-warning/40 bg-warning/5 text-warning";
      case "OUT_OF_SERVICE":
        return "border-destructive/40 bg-destructive/5 text-destructive";
      default:
        return "border-muted/40 bg-muted/5 text-muted-foreground";
    }
  };

  const groupResourcesByType = (resources: Resource[]) => {
    const groups: { [key: string]: Resource[] } = {};
    resources.forEach((resource) => {
      if (!groups[resource.type]) {
        groups[resource.type] = [];
      }
      groups[resource.type].push(resource);
    });
    return groups;
  };

  const getResourceTypeName = (type: string) => {
    switch (type) {
      case "CHARGE_STALL":
        return "Charging Stalls";
      case "MAINTENANCE_BAY":
        return "Maintenance Bays";
      case "CLEAN_DETAIL_STALL":
        return "Clean & Detail Stalls";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!depotResources) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No stall data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {depotResources.branding}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
              {depotResources.resources.filter((r) => r.status === "AVAILABLE").length} Available
            </Badge>
            <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
              {depotResources.resources.filter((r) => r.status === "OCCUPIED").length} Occupied
            </Badge>
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
              {depotResources.resources.filter((r) => r.status === "OUT_OF_SERVICE").length} Out
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchDepotResources(depotId)}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {Object.entries(groupResourcesByType(depotResources.resources)).map(
            ([type, resources]) => (
              <Card key={type} className="border-muted/40">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center">
                    {getResourceIcon(type)}
                    <span className="ml-2">{getResourceTypeName(type)}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {resources.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {resources.map((resource) => (
                      <div
                        key={`${resource.type}-${resource.index}`}
                        className={`p-2 rounded-md border text-xs transition-all ${getResourceColor(
                          resource.status
                        )} ${
                          resource.status === "OCCUPIED"
                            ? "pulse-border"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-medium truncate flex-1">
                            {resource.type === "CHARGE_STALL"
                              ? `Stall ${resource.index}`
                              : resource.type === "MAINTENANCE_BAY"
                              ? `Bay ${resource.index}`
                              : `Stall ${resource.index}`}
                          </span>
                          <span className="flex-shrink-0">{getResourceIcon(resource.type)}</span>
                        </div>
                        <div className="text-[10px]">
                          {resource.status === "AVAILABLE" ? (
                            <span className="text-success font-medium">
                              Available
                            </span>
                          ) : resource.status === "OUT_OF_SERVICE" ? (
                            <span className="text-destructive font-medium">
                              Out of Service
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-medium line-clamp-2">
                                {resource.label}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
