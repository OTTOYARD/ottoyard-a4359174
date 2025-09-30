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
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{incident.incidentId}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Vehicle: <span className="font-semibold">{incident.vehicleId}</span> • {incident.city}
              </p>
            </div>
            <Badge className={statusColors[incident.status]}>
              {incident.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
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
      
      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incident.timeline.map((entry, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {entry.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.ts)}
                    </span>
                  </div>
                  <p className="text-sm">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Live Tow Tracker */}
      {incident.tow.assigned && incident.status !== "Closed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Tow Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver:</span>
                <span className="font-semibold">{incident.tow.driver}</span>
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
      
      {/* Report Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Incident #</Label>
              <Input value={incident.incidentId} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input value={formatTimestamp(incident.timestamps.reportedAt)} disabled className="mt-1" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Vehicle ID</Label>
              <Input value={incident.vehicleId} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={reportType} onValueChange={(val) => setReportType(val as any)}>
                <SelectTrigger className="mt-1">
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
            <Label className="text-xs">Short Summary</Label>
            <Input
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
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
            <Label className="text-xs">Location</Label>
            <div className="flex gap-2 mt-1">
              <Input value={incident.location.addr} disabled />
              <Button variant="outline" size="icon" onClick={handleCopyLocation}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {incident.location.lat.toFixed(4)}, {incident.location.lon.toFixed(4)}
            </p>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button onClick={handleSaveReport} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
            {incident.status === "At Depot" && (
              <Button onClick={handleMarkClosed} variant="outline" className="flex-1">
                Mark Closed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
