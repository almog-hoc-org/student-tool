import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface PDFSection {
  title: string;
  items: { label: string; value: string }[];
}

interface ExportButtonProps {
  title: string;
  sections: PDFSection[];
  executiveSummary?: string[];
  chartElementId?: string;
}

export function ExportButton({ title, sections, executiveSummary, chartElementId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // jspdf + html2canvas weigh ~590KB — load them only when actually exporting.
      const { exportToPDF } = await import('@/lib/export/pdf-generator');
      await exportToPDF({ title, sections, executiveSummary, chartElementId });
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-1.5">
      <Download className="w-4 h-4" />
      {loading ? 'מייצא...' : 'הורד דוח PDF'}
    </Button>
  );
}
