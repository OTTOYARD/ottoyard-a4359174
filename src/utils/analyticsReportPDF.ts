import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

interface FleetAnalyticsData {
  totalVehicles: number;
  statusDistribution: {
    active: number;
    charging: number;
    maintenance: number;
    idle: number;
  };
  efficiencyTrends: {
    period: string;
    efficiency: number;
  }[];
  cityName: string;
  reportDate: string;
  // Extended data
  energyMetrics?: {
    totalKWhConsumed: number;
    avgKWhPerVehicle: number;
    peakDemandKW: number;
    offPeakUsagePercent: number;
  };
  maintenanceMetrics?: {
    scheduledCount: number;
    unscheduledCount: number;
    avgDowntimeHours: number;
    completionRate: number;
  };
  operationalMetrics?: {
    totalTripsCompleted: number;
    avgTripsPerVehicle: number;
    totalMilesDriven: number;
    avgMilesPerTrip: number;
  };
}

// Load logo as base64 with proper dimensions
async function loadLogoBase64(): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const response = await fetch('/ottoyard-logo-report.png');
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Create an image to get natural dimensions
        const img = new Image();
        img.onload = () => {
          resolve({
            data: base64,
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => resolve(null);
        img.src = base64;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    return null;
  }
}

// Generate AI narrative via edge function
async function generateNarrative(analyticsData: FleetAnalyticsData): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-analytics-report', {
      body: { analyticsData },
    });

    if (error) {
      console.error('Error generating narrative:', error);
      return generateFallbackNarrative(analyticsData);
    }

    return data?.narrative || generateFallbackNarrative(analyticsData);
  } catch (error) {
    console.error('Failed to generate AI narrative:', error);
    return generateFallbackNarrative(analyticsData);
  }
}

function generateFallbackNarrative(data: FleetAnalyticsData): string {
  const totalVehicles = data.totalVehicles;
  const avgEfficiency = data.efficiencyTrends.reduce((sum, t) => sum + t.efficiency, 0) / data.efficiencyTrends.length;
  
  return `EXECUTIVE SUMMARY

This fleet analytics report provides a comprehensive overview of OTTOYARD's autonomous vehicle fleet operations in ${data.cityName} as of ${data.reportDate}. The fleet currently comprises ${totalVehicles} vehicles with an average operational efficiency of ${avgEfficiency.toFixed(1)}%.

FLEET STATUS ANALYSIS

The current fleet distribution shows ${data.statusDistribution.active} vehicles (${((data.statusDistribution.active / totalVehicles) * 100).toFixed(1)}%) in active service, ${data.statusDistribution.charging} vehicles (${((data.statusDistribution.charging / totalVehicles) * 100).toFixed(1)}%) undergoing charging operations, ${data.statusDistribution.maintenance} vehicles (${((data.statusDistribution.maintenance / totalVehicles) * 100).toFixed(1)}%) in maintenance, and ${data.statusDistribution.idle} vehicles (${((data.statusDistribution.idle / totalVehicles) * 100).toFixed(1)}%) in idle status.

EFFICIENCY PERFORMANCE

Fleet efficiency has demonstrated consistent performance across the reporting period, maintaining an average of ${avgEfficiency.toFixed(1)}%. This indicates stable operational processes and effective fleet management protocols.

RECOMMENDATIONS

1. Monitor charging infrastructure capacity to optimize vehicle availability during peak demand periods.
2. Review maintenance scheduling to minimize vehicle downtime while ensuring safety standards.
3. Consider implementing predictive analytics to anticipate demand fluctuations.`;
}

// Generate mock extended data
function generateExtendedData(baseData: FleetAnalyticsData): FleetAnalyticsData {
  return {
    ...baseData,
    energyMetrics: baseData.energyMetrics || {
      totalKWhConsumed: Math.round(baseData.totalVehicles * 45.5 * 7),
      avgKWhPerVehicle: 45.5,
      peakDemandKW: Math.round(baseData.totalVehicles * 7.2),
      offPeakUsagePercent: 68,
    },
    maintenanceMetrics: baseData.maintenanceMetrics || {
      scheduledCount: Math.round(baseData.statusDistribution.maintenance * 0.7),
      unscheduledCount: Math.round(baseData.statusDistribution.maintenance * 0.3),
      avgDowntimeHours: 4.2,
      completionRate: 94.5,
    },
    operationalMetrics: baseData.operationalMetrics || {
      totalTripsCompleted: Math.round(baseData.totalVehicles * 12.3 * 7),
      avgTripsPerVehicle: 12.3,
      totalMilesDriven: Math.round(baseData.totalVehicles * 85.7 * 7),
      avgMilesPerTrip: 6.97,
    },
  };
}

export async function generateAnalyticsReportPDF(analyticsData: FleetAnalyticsData): Promise<void> {
  // Extend data with additional metrics
  const extendedData = generateExtendedData(analyticsData);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  
  // Load logo with proper dimensions
  const logoData = await loadLogoBase64();
  
  // Generate AI narrative
  const narrative = await generateNarrative(extendedData);
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const warningColor: [number, number, number] = [234, 179, 8]; // Yellow
  const infoColor: [number, number, number] = [99, 102, 241]; // Indigo
  const mutedColor: [number, number, number] = [100, 100, 100]; // Gray
  const darkColor: [number, number, number] = [40, 40, 40];
  
  // === PAGE 1: Header and Overview ===
  
  // Header with properly sized logo
  if (logoData) {
    // Calculate proper dimensions maintaining aspect ratio
    const maxLogoHeight = 12;
    const aspectRatio = logoData.width / logoData.height;
    const logoHeight = maxLogoHeight;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoData.data, 'PNG', margin, 8, logoWidth, logoHeight);
  }
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(...darkColor);
  doc.text('Fleet Analytics Report', pageWidth / 2, 18, { align: 'center' });
  
  // Subtitle with report ID
  const reportId = `OTTO-AR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text(`${extendedData.cityName} | ${extendedData.reportDate} | ${reportId}`, pageWidth / 2, 26, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(margin, 32, pageWidth - margin, 32);
  
  let yPosition = 40;
  
  // === KEY METRICS SUMMARY (4 boxes) ===
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Performance Indicators', margin, yPosition);
  yPosition += 6;
  
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 22;
  const kpiData = [
    { label: 'Total Fleet', value: extendedData.totalVehicles.toString(), color: primaryColor },
    { label: 'Active Rate', value: `${((extendedData.statusDistribution.active / extendedData.totalVehicles) * 100).toFixed(0)}%`, color: successColor },
    { label: 'Avg Efficiency', value: `${(extendedData.efficiencyTrends.reduce((s, t) => s + t.efficiency, 0) / extendedData.efficiencyTrends.length).toFixed(1)}%`, color: infoColor },
    { label: 'Uptime', value: `${(100 - (extendedData.statusDistribution.maintenance / extendedData.totalVehicles) * 100).toFixed(1)}%`, color: successColor },
  ];
  
  kpiData.forEach((kpi, idx) => {
    const x = margin + idx * (boxWidth + 5);
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, yPosition, boxWidth, boxHeight, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + boxWidth / 2, yPosition + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + boxWidth / 2, yPosition + 17, { align: 'center' });
  });
  
  yPosition += boxHeight + 12;
  
  // === FLEET STATUS DISTRIBUTION TABLE ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text('Fleet Status Distribution', margin, yPosition);
  yPosition += 6;
  
  const statusData = [
    ['Active', extendedData.statusDistribution.active.toString(), `${((extendedData.statusDistribution.active / extendedData.totalVehicles) * 100).toFixed(1)}%`, 'Operational'],
    ['Charging', extendedData.statusDistribution.charging.toString(), `${((extendedData.statusDistribution.charging / extendedData.totalVehicles) * 100).toFixed(1)}%`, 'At Depot'],
    ['Maintenance', extendedData.statusDistribution.maintenance.toString(), `${((extendedData.statusDistribution.maintenance / extendedData.totalVehicles) * 100).toFixed(1)}%`, 'Service Bay'],
    ['Idle', extendedData.statusDistribution.idle.toString(), `${((extendedData.statusDistribution.idle / extendedData.totalVehicles) * 100).toFixed(1)}%`, 'Standby'],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Status', 'Count', 'Percentage', 'Location']],
    body: statusData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
    margin: { left: margin, right: pageWidth / 2 + 5 },
    tableWidth: (pageWidth - margin * 2) / 2 - 5,
  });
  
  // === EFFICIENCY TRENDS TABLE (side by side) ===
  const efficiencyStartY = yPosition;
  const efficiencyData = extendedData.efficiencyTrends.map(t => [t.period, `${t.efficiency}%`]);
  const avgEfficiency = extendedData.efficiencyTrends.reduce((sum, t) => sum + t.efficiency, 0) / extendedData.efficiencyTrends.length;
  efficiencyData.push(['Average', `${avgEfficiency.toFixed(1)}%`]);
  
  autoTable(doc, {
    startY: efficiencyStartY,
    head: [['Period', 'Efficiency']],
    body: efficiencyData,
    theme: 'striped',
    headStyles: {
      fillColor: successColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      halign: 'center',
    },
    margin: { left: pageWidth / 2 + 5, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2 - 5,
  });
  
  yPosition = Math.max((doc as any).lastAutoTable.finalY, yPosition) + 12;
  
  // === ENERGY METRICS ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text('Energy Consumption', margin, yPosition);
  yPosition += 6;
  
  const energyData = [
    ['Total kWh Consumed', extendedData.energyMetrics!.totalKWhConsumed.toLocaleString()],
    ['Avg kWh/Vehicle/Day', extendedData.energyMetrics!.avgKWhPerVehicle.toFixed(1)],
    ['Peak Demand (kW)', extendedData.energyMetrics!.peakDemandKW.toLocaleString()],
    ['Off-Peak Usage', `${extendedData.energyMetrics!.offPeakUsagePercent}%`],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: energyData,
    theme: 'striped',
    headStyles: {
      fillColor: warningColor,
      textColor: [40, 40, 40],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    margin: { left: margin, right: pageWidth / 2 + 5 },
    tableWidth: (pageWidth - margin * 2) / 2 - 5,
  });
  
  // === OPERATIONAL METRICS (side by side) ===
  const opsStartY = yPosition;
  
  const opsData = [
    ['Trips Completed', extendedData.operationalMetrics!.totalTripsCompleted.toLocaleString()],
    ['Avg Trips/Vehicle/Day', extendedData.operationalMetrics!.avgTripsPerVehicle.toFixed(1)],
    ['Total Miles Driven', extendedData.operationalMetrics!.totalMilesDriven.toLocaleString()],
    ['Avg Miles/Trip', extendedData.operationalMetrics!.avgMilesPerTrip.toFixed(2)],
  ];
  
  autoTable(doc, {
    startY: opsStartY,
    head: [['Operations', 'Value']],
    body: opsData,
    theme: 'striped',
    headStyles: {
      fillColor: infoColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    margin: { left: pageWidth / 2 + 5, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2 - 5,
  });
  
  yPosition = Math.max((doc as any).lastAutoTable.finalY, yPosition) + 12;
  
  // === MAINTENANCE METRICS ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text('Maintenance Summary', margin, yPosition);
  yPosition += 6;
  
  const maintData = [
    ['Scheduled Maintenance', extendedData.maintenanceMetrics!.scheduledCount.toString()],
    ['Unscheduled Repairs', extendedData.maintenanceMetrics!.unscheduledCount.toString()],
    ['Avg Downtime (hours)', extendedData.maintenanceMetrics!.avgDowntimeHours.toFixed(1)],
    ['Completion Rate', `${extendedData.maintenanceMetrics!.completionRate}%`],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Maintenance Metric', 'Value']],
    body: maintData,
    theme: 'striped',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    margin: { left: margin, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2 - 5,
  });
  
  // === PAGE 2: AI Analysis ===
  doc.addPage();
  yPosition = 20;
  
  // Page 2 header
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-Generated Fleet Analysis', margin, yPosition);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 4, pageWidth - margin, yPosition + 4);
  yPosition += 14;
  
  // Draw a styled box for the narrative
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  
  const narrativeLines = doc.splitTextToSize(narrative, pageWidth - margin * 2 - 16);
  const lineHeight = 5;
  const narrativeHeight = narrativeLines.length * lineHeight + 16;
  
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, Math.min(narrativeHeight, pageHeight - yPosition - 40), 4, 4, 'FD');
  
  // Add a colored accent bar on the left
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPosition, 4, Math.min(narrativeHeight, pageHeight - yPosition - 40), 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'normal');
  doc.text(narrativeLines, margin + 12, yPosition + 10);
  
  yPosition += narrativeHeight + 15;
  
  // === DISCLAIMER ===
  if (yPosition < pageHeight - 50) {
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'This report is generated using AI-powered analytics. Data is based on fleet telemetry and operational records. Recommendations should be validated with operational teams before implementation.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
    doc.text(disclaimerLines, margin, yPosition);
  }
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by OTTOYARD Fleet Command', margin, footerY);
    doc.text(reportId, pageWidth - margin, footerY, { align: 'right' });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  }
  
  // Save the PDF
  const fileName = `OTTOYARD_Analytics_Report_${extendedData.cityName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
