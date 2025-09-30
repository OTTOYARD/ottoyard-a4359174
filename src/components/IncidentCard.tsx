import { MapPin, FileText } from "lucide-react";
import { Incident } from "@/data/incidents-mock";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: () => void;
}

const statusColors = {
  Reported: "bg-muted text-muted-foreground",
  Dispatched: "bg-blue-500 text-white",
  Secured: "bg-orange-500 text-white",
  "At Depot": "bg-purple-500 text-white",
  Closed: "bg-green-500 text-white",
};

const typeLabels = {
  collision: "Collision",
  malfunction: "Malfunction",
  interior: "Interior",
  vandalism: "Vandalism",
};

function formatETA(seconds: number | null): string {
  if (seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function IncidentCard({ incident, isSelected, onSelect }: IncidentCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Left: Vehicle Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {incident.vehicleId.split('-')[0]}
          </div>
        </div>
        
        {/* Middle: Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{incident.vehicleId}</span>
            <Badge variant="outline" className="text-xs">
              {incident.city}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`text-xs ${statusColors[incident.status]}`}>
              {incident.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {typeLabels[incident.type]}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {incident.summary}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatTimestamp(incident.timestamps.reportedAt)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open mini map modal
              }}
            >
              <MapPin className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <FileText className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Right: ETA */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-mono font-semibold">
            {formatETA(incident.etaSeconds)}
          </div>
          {incident.etaSeconds !== null && (
            <div className="text-xs text-muted-foreground">
              {incident.status === "Dispatched" ? "Pickup" : incident.status === "Secured" ? "Return" : "ETA"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
