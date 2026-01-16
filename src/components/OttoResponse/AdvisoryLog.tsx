import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Eye, FileText, Download, Loader2, FileJson } from 'lucide-react';
import { useOttoResponseStore, Advisory, AdvisoryStatus } from '@/stores/ottoResponseStore';
import { supabase } from '@/integrations/supabase/client';
import { generateAdvisoryReportPDF, downloadAdvisoryPDF } from '@/utils/advisoryReportPDF';
import { toast } from 'sonner';

export function AdvisoryLog() {
  const { advisories, acknowledgeAdvisory } = useOttoResponseStore();
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  
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

  const exportAsJSON = (advisory: Advisory) => {
    const payload = JSON.stringify({
      ...advisory,
      timestamp: advisory.timestamp.toISOString(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${advisory.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Advisory exported as JSON');
  };

  const exportAsPDF = async (advisory: Advisory) => {
    setIsGeneratingPDF(advisory.id);
    
    try {
      // Try to get AI-generated detailed content
      let aiContent: string | undefined;
      
      try {
        const { data, error } = await supabase.functions.invoke('otto-response-ai', {
          body: { 
            action: 'generateReport',
            context: {
              advisory: {
                id: advisory.id,
                severity: advisory.severity,
                zoneType: advisory.zoneType,
                vehiclesInside: advisory.vehiclesInside,
                vehiclesNear: advisory.vehiclesNear,
                recommendations: advisory.recommendations,
                selectedSafeHarbors: advisory.selectedSafeHarbors.map(h => h.name),
                oemNotes: advisory.oemNotes,
              }
            }
          },
        });
        
        if (!error && data?.report) {
          aiContent = data.report;
        }
      } catch (err) {
        console.log('AI report generation skipped:', err);
      }

      const blob = await generateAdvisoryReportPDF({
        advisory,
        aiGeneratedContent: aiContent,
      });
      
      downloadAdvisoryPDF(blob, advisory.id);
      toast.success('PDF report downloaded');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(null);
    }
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
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Zone</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Recs</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisories.map((advisory) => (
                  <TableRow key={advisory.id}>
                    <TableCell className="font-mono text-[10px] md:text-xs">{advisory.id}</TableCell>
                    <TableCell className="text-[10px] md:text-xs">
                      {advisory.timestamp.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{getSeverityBadge(advisory.severity)}</TableCell>
                    <TableCell className="capitalize text-xs hidden md:table-cell">
                      {advisory.zoneType || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[100px] truncate hidden lg:table-cell">
                      {getRecommendationsSummary(advisory)}
                    </TableCell>
                    <TableCell>{getStatusBadge(advisory.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedAdvisory(advisory)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => exportAsPDF(advisory)}
                          disabled={isGeneratingPDF === advisory.id}
                          title="Export PDF"
                        >
                          {isGeneratingPDF === advisory.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hidden md:inline-flex"
                          onClick={() => exportAsJSON(advisory)}
                          title="Export JSON"
                        >
                          <FileJson className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm md:text-base">{selectedAdvisory?.id}</DialogTitle>
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

              {/* Zone Coordinates */}
              {selectedAdvisory.zone?.center && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Zone Details</p>
                  <div className="bg-muted p-2 rounded-md text-xs font-mono">
                    <p>Center: {selectedAdvisory.zone.center.lat.toFixed(5)}, {selectedAdvisory.zone.center.lng.toFixed(5)}</p>
                    {selectedAdvisory.zone.radiusMiles && (
                      <p>Radius: {selectedAdvisory.zone.radiusMiles} miles</p>
                    )}
                  </div>
                </div>
              )}
              
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
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyAdvisorySummary(selectedAdvisory)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAsPDF(selectedAdvisory)}
                  disabled={isGeneratingPDF === selectedAdvisory.id}
                  className="flex-1"
                >
                  {isGeneratingPDF === selectedAdvisory.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAsJSON(selectedAdvisory)}
                  className="flex-1"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
              
              {selectedAdvisory.status === 'Submitted' && (
                <Button
                  className="w-full"
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
