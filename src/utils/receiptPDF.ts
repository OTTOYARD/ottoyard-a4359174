import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptItem {
  serviceName: string;
  vehicleName: string;
  depot?: string;
  date?: string;
  time?: string;
  price: number;
}

interface GenerateReceiptPDFOptions {
  orderId: string;
  orderDate: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  customerEmail: string;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatOrderId(id: string): string {
  return `ORD-${id.slice(0, 8).toUpperCase()}`;
}

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

export async function generateReceiptPDF(options: GenerateReceiptPDFOptions): Promise<void> {
  const {
    orderId,
    orderDate,
    items,
    subtotal,
    tax,
    total,
    customerName,
    customerEmail,
  } = options;

  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Add logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, yPos, 40, 40);
      yPos += 12;
    } catch (e) {
      console.error('Failed to add logo to PDF:', e);
    }
  }

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth / 2 + 10, yPos + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('OTTOYARD Fleet Services', pageWidth / 2 + 10, yPos + 16, { align: 'center' });
  doc.text('Thank you for your business!', pageWidth / 2 + 10, yPos + 22, { align: 'center' });

  yPos += 45;

  // Order Info Banner
  doc.setFillColor(34, 197, 94); // Success green
  doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`ORDER: ${formatOrderId(orderId)}`, margin + 5, yPos + 8);
  doc.text('PAID', pageWidth - margin - 5, yPos + 8, { align: 'right' });

  yPos += 20;
  doc.setTextColor(0);

  // Order Details Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS', margin, yPos);
  yPos += 6;

  const orderDetailsData = [
    ['Order Number:', formatOrderId(orderId)],
    ['Order Date:', formatDate(orderDate)],
    ['Customer:', customerName],
    ...(customerEmail ? [['Email:', customerEmail]] : []),
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: orderDetailsData as string[][],
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Services Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICES', margin, yPos);
  yPos += 6;

  const servicesTableData = items.map((item) => [
    item.serviceName,
    item.vehicleName,
    item.depot || '-',
    item.date && item.time ? `${item.date} ${item.time}` : '-',
    `$${item.price.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Service', 'Vehicle', 'Location', 'Scheduled', 'Amount']],
    body: servicesTableData,
    theme: 'striped',
    headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Payment Summary Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT SUMMARY', margin, yPos);
  yPos += 6;

  const summaryData = [
    ['Subtotal:', `$${(subtotal / 100).toFixed(2)}`],
    ['Sales Tax (8.25%):', `$${(tax / 100).toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 2;

  // Total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, 80, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('TOTAL PAID:', margin + 3, yPos + 7);
  doc.text(`$${(total / 100).toFixed(2)}`, margin + 77, yPos + 7, { align: 'right' });

  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  const footerText = [
    'This receipt confirms your payment for the services listed above.',
    'For questions or support, please contact support@ottoyard.com',
    '',
    `Receipt generated: ${formatDate(new Date().toISOString())}`,
  ];

  footerText.forEach((line, index) => {
    doc.text(line, pageWidth / 2, yPos + index * 5, { align: 'center' });
  });

  // Save the PDF
  doc.save(`OTTOYARD-Receipt-${formatOrderId(orderId)}.pdf`);
}
