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

const BRAND_ORANGE = '#e67e22';
const NAVY = '#1a2238';

export async function exportToPDF(options: PDFExportOptions): Promise<void>;
export async function exportToPDF(title: string, data: Record<string, unknown>, chartElementId?: string): Promise<void>;
export async function exportToPDF(
  titleOrOptions: string | PDFExportOptions,
  data?: Record<string, unknown>,
  chartElementId?: string
) {
  const opts: PDFExportOptions = typeof titleOrOptions === 'string'
    ? {
      title: titleOrOptions,
      sections: [{
        title: 'נתונים',
        items: Object.entries(data || {}).map(([label, value]) => ({ label, value: String(value) })),
      }],
      chartElementId,
    }
    : titleOrOptions;

  await exportHebrewReportAsImage(opts);
}

function textNode(tag: keyof HTMLElementTagNameMap, text: string, className?: string) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

async function exportHebrewReportAsImage(opts: PDFExportOptions) {
  const wrapper = document.createElement('div');
  wrapper.dir = 'rtl';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  wrapper.style.background = '#ffffff';
  wrapper.style.color = '#111827';
  wrapper.style.fontFamily = 'Arial, "Noto Sans Hebrew", "Rubik", sans-serif';
  wrapper.style.padding = '0';
  wrapper.style.direction = 'rtl';

  const page = document.createElement('div');
  page.style.padding = '44px 56px 36px';
  page.style.boxSizing = 'border-box';
  page.style.minHeight = '1123px';
  page.style.borderTop = `10px solid ${BRAND_ORANGE}`;
  wrapper.appendChild(page);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '26px';
  const brand = textNode('div', 'ארגז הכלים - הדרך לדירה');
  brand.style.color = BRAND_ORANGE;
  brand.style.fontWeight = '700';
  const date = textNode('div', new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' }));
  date.style.color = '#6b7280';
  date.style.fontSize = '14px';
  header.append(brand, date);
  page.appendChild(header);

  const title = textNode('h1', opts.title);
  title.style.margin = '0 0 8px';
  title.style.color = NAVY;
  title.style.fontSize = '32px';
  title.style.lineHeight = '1.2';
  page.appendChild(title);

  if (opts.subtitle) {
    const subtitle = textNode('p', opts.subtitle);
    subtitle.style.margin = '0 0 18px';
    subtitle.style.color = '#6b7280';
    subtitle.style.fontSize = '16px';
    page.appendChild(subtitle);
  }

  const separator = document.createElement('div');
  separator.style.height = '3px';
  separator.style.width = '100%';
  separator.style.background = BRAND_ORANGE;
  separator.style.borderRadius = '999px';
  separator.style.margin = '18px 0 24px';
  page.appendChild(separator);

  if (opts.executiveSummary?.length) {
    const summary = document.createElement('section');
    summary.style.background = '#fff7ed';
    summary.style.border = '1px solid #fed7aa';
    summary.style.borderRadius = '18px';
    summary.style.padding = '18px 20px';
    summary.style.marginBottom = '24px';
    const summaryTitle = textNode('h2', 'סיכום מנהלים');
    summaryTitle.style.margin = '0 0 12px';
    summaryTitle.style.color = NAVY;
    summaryTitle.style.fontSize = '20px';
    summary.appendChild(summaryTitle);
    const ul = document.createElement('ul');
    ul.style.margin = '0';
    ul.style.padding = '0 20px 0 0';
    ul.style.lineHeight = '1.8';
    opts.executiveSummary.forEach((line) => ul.appendChild(textNode('li', line)));
    summary.appendChild(ul);
    page.appendChild(summary);
  }

  for (const section of opts.sections) {
    const sectionEl = document.createElement('section');
    sectionEl.style.marginBottom = '22px';
    sectionEl.style.breakInside = 'avoid';

    const h2 = textNode('h2', section.title);
    h2.style.margin = '0 0 10px';
    h2.style.color = NAVY;
    h2.style.fontSize = '20px';
    sectionEl.appendChild(h2);

    const rows = document.createElement('div');
    rows.style.border = '1px solid #e5e7eb';
    rows.style.borderRadius = '14px';
    rows.style.overflow = 'hidden';

    section.items.forEach((item, index) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 1fr';
      row.style.gap = '18px';
      row.style.padding = '10px 14px';
      row.style.background = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      row.style.borderBottom = index === section.items.length - 1 ? '0' : '1px solid #e5e7eb';

      const label = textNode('div', item.label);
      label.style.color = '#6b7280';
      const value = textNode('div', item.value);
      value.style.color = NAVY;
      value.style.fontWeight = '700';
      value.style.textAlign = 'left';
      value.style.direction = 'rtl';
      row.append(label, value);
      rows.appendChild(row);
    });

    sectionEl.appendChild(rows);
    page.appendChild(sectionEl);
  }

  if (opts.chartElementId) {
    const chartEl = document.getElementById(opts.chartElementId);
    if (chartEl) {
      try {
        const chartCanvas = await html2canvas(chartEl, { backgroundColor: '#ffffff', scale: 2 });
        const img = document.createElement('img');
        img.src = chartCanvas.toDataURL('image/png');
        img.style.width = '100%';
        img.style.margin = '10px 0 20px';
        img.style.borderRadius = '14px';
        page.appendChild(img);
      } catch (err) {
        console.error('Chart capture error:', err);
      }
    }
  }

  const disclaimer = textNode('div', opts.disclaimer || 'המידע המוצג הינו להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי. ארגז הכלים - הדרך לדירה © 2026');
  disclaimer.style.marginTop = '24px';
  disclaimer.style.paddingTop = '14px';
  disclaimer.style.borderTop = '1px solid #e5e7eb';
  disclaimer.style.textAlign = 'center';
  disclaimer.style.color = '#9ca3af';
  disclaimer.style.fontSize = '12px';
  page.appendChild(disclaimer);

  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setLanguage('he');

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `${opts.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(filename);
  } finally {
    wrapper.remove();
  }
}
