import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFSection {
  title: string;
  items: { label: string; value: string }[];
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  executiveSummary?: string[];
  sections: PDFSection[];
  chartElementId?: string;
  disclaimer?: string;
}

const BRAND_ORANGE_R = 230;
const BRAND_ORANGE_G = 126;
const BRAND_ORANGE_B = 34;
const NAVY_R = 26;
const NAVY_G = 34;
const NAVY_B = 56;

export async function exportToPDF(options: PDFExportOptions): Promise<void>;
export async function exportToPDF(title: string, data: Record<string, any>, chartElementId?: string): Promise<void>;
export async function exportToPDF(
  titleOrOptions: string | PDFExportOptions,
  data?: Record<string, any>,
  chartElementId?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setLanguage('he');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // If called with the legacy signature (string, data, chartId)
  if (typeof titleOrOptions === 'string') {
    return legacyExport(doc, titleOrOptions, data || {}, chartElementId, pageWidth, margin, contentWidth);
  }

  const opts = titleOrOptions;
  let y = 15;

  // --- Branded Header ---
  // Orange accent line
  doc.setFillColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Brand name
  y = 18;
  doc.setFontSize(10);
  doc.setTextColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
  doc.text('ארגז הכלים - הדרך לדירה', pageWidth - margin, y, { align: 'right' });

  // Date
  const date = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setTextColor(120, 120, 120);
  doc.text(date, margin, y);

  // Title
  y = 30;
  doc.setFontSize(22);
  doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, pageWidth - margin, y, { align: 'right' });

  if (opts.subtitle) {
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(opts.subtitle, pageWidth - margin, y, { align: 'right' });
  }

  // Orange separator
  y += 6;
  doc.setDrawColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Executive Summary ---
  if (opts.executiveSummary && opts.executiveSummary.length > 0) {
    doc.setFillColor(255, 253, 245); // Warm cream background
    doc.roundedRect(margin, y - 2, contentWidth, opts.executiveSummary.length * 7 + 12, 3, 3, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
    doc.text('סיכום מנהלים', pageWidth - margin - 4, y + 4, { align: 'right' });
    y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    for (const line of opts.executiveSummary) {
      doc.text(`• ${line}`, pageWidth - margin - 4, y, { align: 'right' });
      y += 7;
    }
    y += 6;
  }

  // --- Sections ---
  for (const section of opts.sections) {
    if (y + 20 > 270) {
      doc.addPage();
      y = 20;
    }

    // Section title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
    doc.text(section.title, pageWidth - margin, y, { align: 'right' });
    y += 2;

    // Orange underline for section
    doc.setDrawColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
    doc.setLineWidth(0.4);
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);
    y += 6;

    // Items
    doc.setFontSize(10);
    for (const item of section.items) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Alternating row background
      const rowIndex = section.items.indexOf(item);
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(item.label, pageWidth - margin - 4, y, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
      doc.text(item.value, margin + 4, y);

      y += 7;
    }
    y += 6;
  }

  // --- Chart ---
  if (opts.chartElementId) {
    const chartEl = document.getElementById(opts.chartElementId);
    if (chartEl) {
      try {
        const canvas = await html2canvas(chartEl, { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        if (y + 100 > 270) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgData, 'PNG', margin, y, contentWidth, 90);
        y += 96;
      } catch (err) {
        console.error('Chart capture error:', err);
      }
    }
  }

  // --- Disclaimer ---
  const disclaimer = opts.disclaimer || 'המידע המוצג הינו להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי. ארגז הכלים - הדרך לדירה © 2026';
  if (y + 20 > 270) {
    doc.addPage();
    y = 20;
  }
  y = Math.max(y, 270);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(disclaimer, pageWidth / 2, y, { align: 'center' });

  // --- Footer page numbers ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i} / ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  // Save
  const filename = `${opts.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}

// Legacy function for backwards compatibility
function legacyExport(
  doc: jsPDF,
  title: string,
  data: Record<string, any>,
  chartElementId: string | undefined,
  pageWidth: number,
  margin: number,
  contentWidth: number
) {
  // Orange accent
  doc.setFillColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFontSize(22);
  doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
  doc.text(title, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(date, 105, 30, { align: 'center' });

  doc.setDrawColor(BRAND_ORANGE_R, BRAND_ORANGE_G, BRAND_ORANGE_B);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);

  let y = 45;
  doc.setFontSize(14);
  Object.entries(data).forEach(([key, value]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY_R, NAVY_G, NAVY_B);
    doc.text(key, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(String(value), 100, y);
    y += 10;
  });

  if (chartElementId) {
    const chartEl = document.getElementById(chartElementId);
    if (chartEl) {
      html2canvas(chartEl, { backgroundColor: '#ffffff', scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        if (y + 100 > 270) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgData, 'PNG', margin, y, contentWidth, 100);
        const filename = `${title.replace(/\s/g, '-')}-${Date.now()}.pdf`;
        doc.save(filename);
      });
      return;
    }
  }

  const filename = `${title.replace(/\s/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}
