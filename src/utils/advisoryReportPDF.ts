import jsPDF from 'jspdf';
import { Advisory } from '@/stores/ottoResponseStore';

export interface AdvisoryReportData {
  advisory: Advisory;
  aiGeneratedContent?: string;
}

export async function generateAdvisoryReportPDF(data: AdvisoryReportData): Promise<Blob> {
  const { advisory, aiGeneratedContent } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 20;

  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, y + (index * lineHeight));
    });
    return y + (lines.length * lineHeight);
  };

  // Header with branding
  doc.setFillColor(17, 24, 39); // Dark background
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OTTO-RESPONSE', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Advisory Report for OEM Operations', margin, 23);
  
  doc.setFontSize(9);
  doc.text(`Report ID: ${advisory.id}`, pageWidth - margin - 50, 15);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 60, 23);

  yPos = 45;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Advisory Summary Box
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos, contentWidth, 30, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, yPos, contentWidth, 30, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Advisory Summary', margin + 5, yPos + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const severityColors: Record<string, [number, number, number]> = {
    'High': [239, 68, 68],
    'Medium': [245, 158, 11],
    'Low': [34, 197, 94],
  };
  
  const sevColor = severityColors[advisory.severity] || [107, 114, 128];
  doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Severity: ${advisory.severity}`, margin + 5, yPos + 16);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${advisory.status}`, margin + 60, yPos + 16);
  doc.text(`Zone Type: ${advisory.zoneType || 'N/A'}`, margin + 120, yPos + 16);
  doc.text(`Timestamp: ${advisory.timestamp.toLocaleString()}`, margin + 5, yPos + 24);

  yPos += 40;

  // Zone Analytics
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Zone Analytics', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const zoneDetails = [
    `Vehicles Inside Zone: ${advisory.vehiclesInside}`,
    `Vehicles Near Zone: ${advisory.vehiclesNear}`,
  ];

  if (advisory.zone?.type === 'radius' && advisory.zone.radiusMiles) {
    zoneDetails.push(`Zone Radius: ${advisory.zone.radiusMiles} miles`);
  }
  if (advisory.zone?.center) {
    zoneDetails.push(`Zone Center: ${advisory.zone.center.lat.toFixed(4)}, ${advisory.zone.center.lng.toFixed(4)}`);
  }

  zoneDetails.forEach(detail => {
    doc.text(`• ${detail}`, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Recommendations
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Actions', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const recommendations = [];
  if (advisory.recommendations.pauseDispatches) recommendations.push('Pause new dispatches in affected zone');
  if (advisory.recommendations.avoidZoneRouting) recommendations.push('Implement avoid-zone routing protocols');
  if (advisory.recommendations.waveBasedRecovery) {
    recommendations.push(`Wave-based recovery (${advisory.recommendations.waveSize} vehicles every ${advisory.recommendations.waveIntervalMinutes} minutes)`);
  }
  if (advisory.recommendations.safeHarborStaging) recommendations.push('Direct vehicles to Safe Harbor locations');
  if (advisory.recommendations.keepClearCorridors) recommendations.push('Maintain keep-clear corridors for emergency access');

  if (recommendations.length === 0) {
    recommendations.push('Standard monitoring recommended');
  }

  recommendations.forEach(rec => {
    doc.text(`✓ ${rec}`, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Safe Harbors
  if (advisory.selectedSafeHarbors.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Designated Safe Harbors', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    advisory.selectedSafeHarbors.forEach(harbor => {
      doc.text(`• ${harbor.name} (${harbor.type}) - ${harbor.availableCapacity} slots available`, margin + 5, yPos);
      yPos += 6;
    });

    yPos += 5;
  }

  // OEM Notes
  if (advisory.oemNotes || aiGeneratedContent) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OEM Communication Notes', margin, yPos);
    yPos += 8;

    doc.setFillColor(249, 250, 251);
    const notesText = aiGeneratedContent || advisory.oemNotes;
    const notesLines = doc.splitTextToSize(notesText, contentWidth - 10);
    const notesHeight = Math.max(notesLines.length * 5 + 10, 30);
    
    doc.rect(margin, yPos, contentWidth, notesHeight, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(margin, yPos, contentWidth, notesHeight, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(notesText, margin + 5, yPos + 8, contentWidth - 10);
    yPos += 10;
  }

  // AI Generated Report Content
  if (aiGeneratedContent && aiGeneratedContent !== advisory.oemNotes) {
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Generated Detailed Report', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(aiGeneratedContent, margin, yPos, contentWidth);
    yPos += 10;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('This advisory is a non-binding operational recommendation for OEM awareness.', margin, footerY);
  doc.text('The OEM retains full vehicle routing and control discretion.', margin, footerY + 5);
  doc.text('OTTOYARD Fleet Management System', pageWidth - margin - 55, footerY + 5);

  return doc.output('blob');
}

export function downloadAdvisoryPDF(blob: Blob, advisoryId: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${advisoryId}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
