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
}

// Load logo as base64
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/ottoyard-logo-report.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
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
  
  return `This fleet analytics report provides a comprehensive overview of OTTOYARD's autonomous vehicle fleet operations in ${data.cityName} as of ${data.reportDate}. The fleet currently comprises ${totalVehicles} vehicles with an average operational efficiency of ${avgEfficiency.toFixed(1)}%.

The current fleet distribution shows ${data.statusDistribution.active} vehicles in active service, ${data.statusDistribution.charging} vehicles undergoing charging operations, ${data.statusDistribution.maintenance} vehicles in maintenance, and ${data.statusDistribution.idle} vehicles in idle status.

Fleet efficiency has demonstrated consistent performance across the reporting period, maintaining an average of ${avgEfficiency.toFixed(1)}%. This indicates stable operational processes and effective fleet management protocols.`;
}

export async function generateAnalyticsReportPDF(analyticsData: FleetAnalyticsData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  
  // Load logo
  const logoBase64 = await loadLogoBase64();
  
  // Generate AI narrative
  const narrative = await generateNarrative(analyticsData);
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const warningColor: [number, number, number] = [234, 179, 8]; // Yellow
  const mutedColor: [number, number, number] = [100, 100, 100]; // Gray
  const darkColor: [number, number, number] = [40, 40, 40];
  
  // Header with logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 10, 40, 15);
  }
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(...darkColor);
  doc.text('Fleet Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(...mutedColor);
  doc.text(`${analyticsData.cityName} | ${analyticsData.reportDate}`, pageWidth / 2, 28, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, 33, pageWidth - margin, 33);
  
  let yPosition = 42;
  
  // Fleet Overview Section
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('Fleet Overview', margin, yPosition);
  yPosition += 8;
  
  // Key metrics row
  const metricsData = [
    ['Total Vehicles', analyticsData.totalVehicles.toString()],
    ['Active', `${analyticsData.statusDistribution.active} (${((analyticsData.statusDistribution.active / analyticsData.totalVehicles) * 100).toFixed(0)}%)`],
    ['Charging', `${analyticsData.statusDistribution.charging} (${((analyticsData.statusDistribution.charging / analyticsData.totalVehicles) * 100).toFixed(0)}%)`],
    ['Maintenance', `${analyticsData.statusDistribution.maintenance} (${((analyticsData.statusDistribution.maintenance / analyticsData.totalVehicles) * 100).toFixed(0)}%)`],
    ['Idle', `${analyticsData.statusDistribution.idle} (${((analyticsData.statusDistribution.idle / analyticsData.totalVehicles) * 100).toFixed(0)}%)`],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: margin, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2,
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 12;
  
  // Efficiency Trends Section
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('Efficiency Trends', margin, yPosition);
  yPosition += 8;
  
  const efficiencyData = analyticsData.efficiencyTrends.map(t => [t.period, `${t.efficiency}%`]);
  const avgEfficiency = analyticsData.efficiencyTrends.reduce((sum, t) => sum + t.efficiency, 0) / analyticsData.efficiencyTrends.length;
  efficiencyData.push(['Average', `${avgEfficiency.toFixed(1)}%`]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Period', 'Efficiency']],
    body: efficiencyData,
    theme: 'grid',
    headStyles: {
      fillColor: successColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244],
    },
    margin: { left: margin, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2,
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 12;
  
  // AI Analysis Section
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('AI-Generated Analysis', margin, yPosition);
  yPosition += 8;
  
  // Draw a box for the narrative
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 252);
  
  const narrativeLines = doc.splitTextToSize(narrative, pageWidth - margin * 2 - 10);
  const narrativeHeight = narrativeLines.length * 5 + 10;
  
  // Check if we need a new page
  if (yPosition + narrativeHeight > pageHeight - 30) {
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text('AI-Generated Analysis (continued)', margin, yPosition);
    yPosition += 8;
  }
  
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, Math.min(narrativeHeight, pageHeight - yPosition - 30), 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(narrativeLines, margin + 5, yPosition + 7);
  
  yPosition += narrativeHeight + 10;
  
  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('Generated by OTTOYARD Fleet Command', margin, footerY);
  doc.text(`Report ID: OTTO-ANALYTICS-${Date.now().toString(36).toUpperCase()}`, pageWidth - margin, footerY, { align: 'right' });
  
  // Page number
  doc.text(`Page 1 of 1`, pageWidth / 2, footerY, { align: 'center' });
  
  // Save the PDF
  const fileName = `OTTOYARD_Analytics_Report_${analyticsData.cityName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
