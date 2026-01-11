import { useState, useEffect } from "react";
import { Incident } from "@/data/incidents-mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIncidentsStore } from "@/stores/incidentsStore";
import { OEMVehicleIcon } from "@/components/OEMVehicleIcon";

interface IncidentDetailsProps {
  incident: Incident;
}

const statusColors = {
  Reported: "bg-muted text-muted-foreground",
  Dispatched: "bg-blue-500 text-white",
  Secured: "bg-orange-500 text-white",
  "At Depot": "bg-purple-500 text-white",
  Closed: "bg-green-500 text-white",
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatETA(seconds: number | null): string {
  if (seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function IncidentDetails({ incident }: IncidentDetailsProps) {
  const { toast } = useToast();
  const updateIncidentReport = useIncidentsStore((state) => state.updateIncidentReport);
  const markIncidentClosed = useIncidentsStore((state) => state.markIncidentClosed);
  
  const [reportType, setReportType] = useState(incident.type);
  const [reportSummary, setReportSummary] = useState(incident.report.shortSummary);
  const [reportComments, setReportComments] = useState(incident.report.comments);
  
  useEffect(() => {
    setReportType(incident.type);
    setReportSummary(incident.report.shortSummary);
    setReportComments(incident.report.comments);
  }, [incident.incidentId]);
  
  const handleSaveReport = () => {
    updateIncidentReport(incident.incidentId, {
      shortSummary: reportSummary,
      comments: reportComments,
    });
    toast({
      title: "Report saved",
      description: "Incident report has been updated.",
    });
  };
  
  const handleMarkClosed = () => {
    if (incident.status === "At Depot") {
      markIncidentClosed(incident.incidentId);
      toast({
        title: "Incident closed",
        description: `Incident ${incident.incidentId} has been marked as closed.`,
      });
    }
  };
  
  const handleCopyLocation = () => {
    navigator.clipboard.writeText(`${incident.location.lat}, ${incident.location.lon}`);
    toast({
      title: "Location copied",
      description: "Coordinates copied to clipboard.",
    });
  };
  
  return (
    <div className="space-y-2 md:space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <OEMVehicleIcon name={incident.vehicleId} size="lg" withBackground />
              <div>
                <CardTitle className="text-sm md:text-lg truncate">{incident.incidentId}</CardTitle>
                <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 truncate">
                  Vehicle: <span className="font-semibold">{incident.vehicleId}</span> • {incident.city}
                </p>
              </div>
            </div>
            <Badge className={`${statusColors[incident.status]} text-[9px] md:text-xs whitespace-nowrap`}>
              {incident.status}
            </Badge>
          </div>
          <p className="text-[9px] md:text-xs text-muted-foreground mt-1 md:mt-2">
            Last updated: {formatTimestamp(incident.timestamps[
              incident.status === "Closed" ? "closedAt" :
              incident.status === "At Depot" ? "atDepotAt" :
              incident.status === "Secured" ? "securedAt" :
              incident.status === "Dispatched" ? "dispatchedAt" :
              "reportedAt"
            ])}
          </p>
        </CardHeader>
      </Card>
      
      {/* Timeline - Simplified for mobile */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-xs md:text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
          <div className="space-y-2 md:space-y-3">
            {incident.timeline.slice(0, 3).map((entry, idx) => (
              <div key={idx} className="flex gap-2 md:gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary mt-1 md:mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                    <Badge variant="outline" className="text-[9px] md:text-xs whitespace-nowrap">
                      {entry.status}
                    </Badge>
                    <span className="text-[9px] md:text-xs text-muted-foreground">
                      {formatTimestamp(entry.ts)}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-sm truncate md:whitespace-normal">{entry.note}</p>
                </div>
              </div>
            ))}
            {incident.timeline.length > 3 && (
              <p className="text-[9px] md:text-xs text-muted-foreground pl-4 md:pl-5">
                + {incident.timeline.length - 3} more events
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Live Tow Tracker */}
      {incident.tow.assigned && incident.status !== "Closed" && (
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-xs md:text-base">Live Tow Tracker</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="space-y-1 md:space-y-2 text-[10px] md:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver:</span>
                <span className="font-semibold truncate ml-2">{incident.tow.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Truck ID:</span>
                <span className="font-semibold">{incident.tow.truckId}</span>
              </div>
              {incident.status === "Dispatched" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup ETA:</span>
                  <span className="font-semibold">{formatETA(incident.etaSeconds)}</span>
                </div>
              )}
              {incident.status === "Secured" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return ETA:</span>
                  <span className="font-semibold">{formatETA(incident.etaSeconds)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Report Card - Simplified for mobile */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-xs md:text-base">Incident Report</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-2 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <Label className="text-[9px] md:text-xs">Incident #</Label>
              <Input value={incident.incidentId} disabled className="mt-1 h-7 md:h-10 text-[10px] md:text-sm" />
            </div>
            <div>
              <Label className="text-[9px] md:text-xs">Time</Label>
              <Input value={formatTimestamp(incident.timestamps.reportedAt)} disabled className="mt-1 h-7 md:h-10 text-[10px] md:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <Label className="text-[9px] md:text-xs">Vehicle ID</Label>
              <Input value={incident.vehicleId} disabled className="mt-1 h-7 md:h-10 text-[10px] md:text-sm" />
            </div>
            <div>
              <Label className="text-[9px] md:text-xs">Type</Label>
              <Select value={reportType} onValueChange={(val) => setReportType(val as any)}>
                <SelectTrigger className="mt-1 h-7 md:h-10 text-[10px] md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collision">Collision</SelectItem>
                  <SelectItem value="malfunction">Malfunction</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-[9px] md:text-xs">Summary</Label>
            <Input
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              className="mt-1 h-7 md:h-10 text-[10px] md:text-sm"
            />
          </div>
          
          <div className="hidden md:block">
            <Label className="text-xs">Comments</Label>
            <Textarea
              value={reportComments}
              onChange={(e) => setReportComments(e.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Add detailed notes..."
            />
          </div>
          
          <div>
            <Label className="text-[9px] md:text-xs">Location</Label>
            <div className="flex gap-1 md:gap-2 mt-1">
              <Input value={incident.location.addr} disabled className="h-7 md:h-10 text-[10px] md:text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLocation} className="h-7 w-7 md:h-10 md:w-10">
                <Copy className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
            <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
              {incident.location.lat.toFixed(4)}, {incident.location.lon.toFixed(4)}
            </p>
          </div>
          
          <Separator className="my-2 md:my-4" />
          
          <div className="flex gap-2">
            <Button onClick={handleSaveReport} className="flex-1 h-7 md:h-10 text-[10px] md:text-sm">
              <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Save
            </Button>
            {incident.status === "At Depot" && (
              <Button onClick={handleMarkClosed} variant="outline" className="flex-1 h-7 md:h-10 text-[10px] md:text-sm">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
