import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPDF(
  title: string,
  data: Record<string, any>,
  chartElementId?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Hebrew font support (using default for now)
  doc.setLanguage('he');
  
  // Header
  doc.setFontSize(24);
  doc.text(title, 105, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(12);
  const date = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(date, 105, 30, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  let yPosition = 45;
  
  // Add data
  doc.setFontSize(14);
  Object.entries(data).forEach(([key, value]) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(key, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 100, yPosition);
    yPosition += 10;
  });
  
  // Add chart if element ID provided
  if (chartElementId) {
    const chartElement = document.getElementById(chartElementId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');
        
        if (yPosition + 100 > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.addImage(imgData, 'PNG', 20, yPosition, 170, 100);
      } catch (error) {
        console.error('Error generating chart image:', error);
      }
    }
  }
  
  // Save
  const filename = `${title.replace(/\s/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}
