import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFSection {
  title: string;
  items: { label: string; value: string }[];
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  sections: PDFSection[];
  riskScore?: number; // 0-100
  chartElementId?: string;
  summaryNote?: string;
}

function drawRiskGauge(doc: jsPDF, score: number, x: number, y: number) {
  const color = score >= 70 ? [34, 197, 94] : score >= 40 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(color[0], color[1], color[2]);
  const width = (score / 100) * 60;
  doc.roundedRect(x, y, 60, 6, 3, 3, 'S');
  doc.roundedRect(x, y, width, 6, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${score}/100`, x + 65, y + 5);
}

export async function exportToPDF(
  title: string,
  data: Record<string, any>,
  chartElementId?: string
) {
  // Legacy support - convert old format to new
  const sections: PDFSection[] = [{
    title: 'תוצאות',
    items: Object.entries(data).map(([label, value]) => ({ label, value: String(value) })),
  }];

  return exportAdvancedPDF({
    title,
    sections,
    chartElementId,
  });
}

export async function exportAdvancedPDF(options: PDFExportOptions) {
  const { title, subtitle, sections, riskScore, chartElementId, summaryNote } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setLanguage('he');

  // === Header band ===
  doc.setFillColor(30, 58, 95); // Navy
  doc.rect(0, 0, 210, 36, 'F');

  // Gold accent line
  doc.setFillColor(201, 162, 39);
  doc.rect(0, 36, 210, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 105, 16, { align: 'center' });

  // Subtitle / date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(subtitle || date, 105, 26, { align: 'center' });

  // Brand tag
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text('הדרך לדירה – מערכת תומכת החלטה', 105, 33, { align: 'center' });

  let yPosition = 45;

  // === Risk Score ===
  if (riskScore !== undefined) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text('מד ביטחון:', 180, yPosition, { align: 'right' });
    drawRiskGauge(doc, riskScore, 20, yPosition - 4);
    yPosition += 14;
  }

  // === Sections ===
  for (const section of sections) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Section header
    doc.setFillColor(240, 243, 248);
    doc.roundedRect(15, yPosition - 4, 180, 9, 2, 2, 'F');
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(12);
    doc.text(section.title, 190, yPosition + 2, { align: 'right' });
    yPosition += 12;

    // Section items
    doc.setFontSize(10);
    for (const item of section.items) {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(100, 100, 100);
      doc.text(item.label, 190, yPosition, { align: 'right' });
      doc.setTextColor(30, 30, 30);
      doc.text(item.value, 20, yPosition, { align: 'left' });

      // Light divider
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(20, yPosition + 2, 190, yPosition + 2);

      yPosition += 8;
    }

    yPosition += 5;
  }

  // === Chart ===
  if (chartElementId) {
    const chartElement = document.getElementById(chartElementId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');

        if (yPosition + 90 > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.addImage(imgData, 'PNG', 20, yPosition, 170, 85);
        yPosition += 90;
      } catch (error) {
        console.error('Error generating chart image:', error);
      }
    }
  }

  // === Summary Note ===
  if (summaryNote) {
    if (yPosition + 20 > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(255, 251, 235); // Light gold bg
    doc.roundedRect(15, yPosition, 180, 14, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(120, 100, 30);
    doc.text(summaryNote, 105, yPosition + 8, { align: 'center', maxWidth: 170 });
    yPosition += 20;
  }

  // === Footer ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('המידע להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי', 105, 288, { align: 'center' });
    doc.text(`עמוד ${i} מתוך ${pageCount}`, 20, 288);
  }

  // Save
  const filename = `${title.replace(/\s/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}
