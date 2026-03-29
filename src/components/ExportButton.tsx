import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToPDF } from '@/lib/export/pdf-generator';
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
