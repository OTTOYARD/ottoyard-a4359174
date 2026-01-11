import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StatementOrder {
  id: string;
  created_at: string;
  items_jsonb: any[];
  total_amount: number;
  status: string;
}

interface GenerateStatementPDFOptions {
  statementMonth: string; // YYYY-MM format
  orders: StatementOrder[];
  totalAmount: number;
  taxAmount: number;
  customerName: string;
  customerEmail: string;
  companyName?: string;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

export async function generateStatementPDF(options: GenerateStatementPDFOptions): Promise<void> {
  const {
    statementMonth,
    orders,
    totalAmount,
    taxAmount,
    customerName,
    customerEmail,
    companyName,
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
  doc.text('MONTHLY STATEMENT', pageWidth / 2 + 10, yPos + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('OTTOYARD Fleet Services', pageWidth / 2 + 10, yPos + 16, { align: 'center' });
  doc.text(`Statement Period: ${formatMonth(statementMonth)}`, pageWidth / 2 + 10, yPos + 22, { align: 'center' });

  yPos += 45;

  // Statement Summary Banner
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${orders.length} Orders`, margin + 5, yPos + 8);
  doc.text(`Total: $${(totalAmount / 100).toFixed(2)}`, pageWidth - margin - 5, yPos + 8, { align: 'right' });

  yPos += 20;
  doc.setTextColor(0);

  // Customer Details Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT DETAILS', margin, yPos);
  yPos += 6;

  const customerDetailsData = [
    ['Account Holder:', customerName],
    ['Email:', customerEmail],
    ...(companyName ? [['Company:', companyName]] : []),
    ['Statement Period:', formatMonth(statementMonth)],
    ['Generated:', formatDate(new Date().toISOString())],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: customerDetailsData as string[][],
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Orders Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER SUMMARY', margin, yPos);
  yPos += 6;

  const ordersTableData = orders.map((order) => {
    const itemsSummary = order.items_jsonb?.length > 0
      ? order.items_jsonb.length === 1
        ? order.items_jsonb[0].serviceName
        : `${order.items_jsonb[0].serviceName} + ${order.items_jsonb.length - 1} more`
      : 'N/A';
    
    return [
      formatOrderId(order.id),
      formatDate(order.created_at),
      itemsSummary,
      order.status === 'completed' ? 'Paid' : order.status,
      `$${(order.total_amount / 100).toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Order ID', 'Date', 'Services', 'Status', 'Amount']],
    body: ordersTableData,
    theme: 'striped',
    headStyles: { fillColor: [80, 80, 80], fontSize: 9 },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Payment Summary Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT SUMMARY', margin, yPos);
  yPos += 6;

  const subtotal = totalAmount;
  const grandTotal = totalAmount + taxAmount;

  const summaryData = [
    ['Subtotal:', `$${(subtotal / 100).toFixed(2)}`],
    ['Sales Tax (8.25%):', `$${(taxAmount / 100).toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 2;

  // Total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, 85, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('TOTAL:', margin + 3, yPos + 7);
  doc.text(`$${(grandTotal / 100).toFixed(2)}`, margin + 82, yPos + 7, { align: 'right' });

  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  const footerText = [
    'This statement summarizes all transactions for the period shown above.',
    'For questions or support, please contact support@ottoyard.com',
    '',
    `Statement generated: ${formatDate(new Date().toISOString())}`,
  ];

  footerText.forEach((line, index) => {
    doc.text(line, pageWidth / 2, yPos + index * 5, { align: 'center' });
  });

  // Save the PDF
  const fileName = `OTTOYARD-Statement-${statementMonth}.pdf`;
  doc.save(fileName);
}
