import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Eye, FileText } from 'lucide-react';
import { useOttoResponseStore, Advisory, AdvisoryStatus } from '@/stores/ottoResponseStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AdvisoryLog() {
  const { advisories, acknowledgeAdvisory } = useOttoResponseStore();
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  
  const getStatusBadge = (status: AdvisoryStatus) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'Submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'Acknowledged':
        return <Badge className="bg-success text-success-foreground">Acknowledged</Badge>;
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'Medium':
        return <Badge className="bg-warning text-warning-foreground">{severity}</Badge>;
      case 'Low':
        return <Badge className="bg-success text-success-foreground">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };
  
  const getRecommendationsSummary = (advisory: Advisory) => {
    const recs = [];
    if (advisory.recommendations.pauseDispatches) recs.push('Pause');
    if (advisory.recommendations.avoidZoneRouting) recs.push('Avoid');
    if (advisory.recommendations.waveBasedRecovery) recs.push('Wave');
    if (advisory.recommendations.safeHarborStaging) recs.push('Harbor');
    if (advisory.recommendations.keepClearCorridors) recs.push('Corridor');
    return recs.length ? recs.join(', ') : 'None';
  };
  
  const copyAdvisorySummary = (advisory: Advisory) => {
    const summary = `
OTTO-RESPONSE Advisory: ${advisory.id}
Time: ${advisory.timestamp.toLocaleString()}
Severity: ${advisory.severity}
Status: ${advisory.status}

Zone: ${advisory.zoneType || 'N/A'}
Vehicles Inside: ${advisory.vehiclesInside}
Vehicles Near: ${advisory.vehiclesNear}

Recommendations:
${advisory.recommendations.pauseDispatches ? '• Pause new dispatches\n' : ''}${advisory.recommendations.avoidZoneRouting ? '• Avoid-zone routing\n' : ''}${advisory.recommendations.waveBasedRecovery ? `• Wave-based recovery (${advisory.recommendations.waveSize} vehicles/${advisory.recommendations.waveIntervalMinutes}min)\n` : ''}${advisory.recommendations.safeHarborStaging ? '• Safe Harbor staging\n' : ''}${advisory.recommendations.keepClearCorridors ? '• Keep-clear corridors\n' : ''}
${advisory.selectedSafeHarbors.length ? `Safe Harbors: ${advisory.selectedSafeHarbors.map(h => h.name).join(', ')}` : ''}

${advisory.oemNotes ? `Notes: ${advisory.oemNotes}` : ''}

---
This advisory is a non-binding operational recommendation for OEM awareness.
    `.trim();
    
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };
  
  if (advisories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No advisories created yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Draw a zone and submit an advisory to see it here
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Advisory History</span>
            <Badge variant="outline">{advisories.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Advisory ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Recommendations</TableHead>
                  <TableHead>Destinations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisories.map((advisory) => (
                  <TableRow key={advisory.id}>
                    <TableCell className="font-mono text-xs">{advisory.id}</TableCell>
                    <TableCell className="text-xs">
                      {advisory.timestamp.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{getSeverityBadge(advisory.severity)}</TableCell>
                    <TableCell className="capitalize text-xs">
                      {advisory.zoneType || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">
                      {getRecommendationsSummary(advisory)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {advisory.selectedSafeHarbors.length > 0 
                        ? advisory.selectedSafeHarbors.map(h => h.name).join(', ')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(advisory.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedAdvisory(advisory)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copyAdvisorySummary(advisory)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Advisory Details Dialog */}
      <Dialog open={!!selectedAdvisory} onOpenChange={() => setSelectedAdvisory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">{selectedAdvisory?.id}</DialogTitle>
          </DialogHeader>
          {selectedAdvisory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{selectedAdvisory.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedAdvisory.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Severity</p>
                  {getSeverityBadge(selectedAdvisory.severity)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Zone Type</p>
                  <p className="text-sm capitalize">{selectedAdvisory.zoneType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicles Inside</p>
                  <p className="text-sm font-medium text-destructive">{selectedAdvisory.vehiclesInside}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicles Near</p>
                  <p className="text-sm font-medium text-warning">{selectedAdvisory.vehiclesNear}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
                <div className="flex flex-wrap gap-1">
                  {selectedAdvisory.recommendations.pauseDispatches && (
                    <Badge variant="outline">Pause Dispatches</Badge>
                  )}
                  {selectedAdvisory.recommendations.avoidZoneRouting && (
                    <Badge variant="outline">Avoid Zone</Badge>
                  )}
                  {selectedAdvisory.recommendations.waveBasedRecovery && (
                    <Badge variant="outline">
                      Wave Recovery ({selectedAdvisory.recommendations.waveSize}/{selectedAdvisory.recommendations.waveIntervalMinutes}min)
                    </Badge>
                  )}
                  {selectedAdvisory.recommendations.safeHarborStaging && (
                    <Badge variant="outline">Safe Harbor</Badge>
                  )}
                  {selectedAdvisory.recommendations.keepClearCorridors && (
                    <Badge variant="outline">Keep-Clear</Badge>
                  )}
                </div>
              </div>
              
              {selectedAdvisory.selectedSafeHarbors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Safe Harbors</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAdvisory.selectedSafeHarbors.map((h) => (
                      <Badge key={h.id} variant="secondary">{h.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedAdvisory.oemNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">OEM Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedAdvisory.oemNotes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyAdvisorySummary(selectedAdvisory)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Summary
                </Button>
                {selectedAdvisory.status === 'Submitted' && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      acknowledgeAdvisory(selectedAdvisory.id);
                      setSelectedAdvisory({ ...selectedAdvisory, status: 'Acknowledged' });
                      toast.success('Advisory acknowledged');
                    }}
                  >
                    Mark Acknowledged
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
