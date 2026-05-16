import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Chunk {
  id: string;
  chunk_index: number;
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sourceId: string | null;
  sourceFile: string | null;
}

/**
 * Opens a dialog showing all chunks of the given source. Resolves either by
 * source_id (preferred — older AI replies before the source_id roll-out only
 * have source_file, so we fall back to that).
 */
export function SourcePreviewDialog({ open, onClose, sourceId, sourceFile }: Props) {
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setChunks(null);
    setError(null);
    const cancelled = { current: false };

    (async () => {
      try {
        let q = supabase
          .from('knowledge_chunks')
          .select('id, chunk_index, content')
          .order('chunk_index', { ascending: true })
          .limit(50);
        if (sourceId) q = q.eq('source_id', sourceId);
        else if (sourceFile) q = q.eq('source_file', sourceFile);
        else throw new Error('Source not specified');

        const { data, error: err } = await q;
        if (cancelled.current) return;
        if (err) throw err;
        setChunks((data as Chunk[]) ?? []);
      } catch (e) {
        if (cancelled.current) return;
        setError((e as Error).message ?? 'שגיאה');
      }
    })();

    return () => { cancelled.current = true; };
  }, [open, sourceId, sourceFile]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {sourceFile || 'מקור'}
          </DialogTitle>
          <DialogDescription>
            התוכן המלא מתוך המקור שעליו התבססה התשובה.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="p-6 text-sm text-destructive text-center">
            לא הצלחנו לטעון את המקור: {error}
          </div>
        ) : !chunks ? (
          <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            טוען…
          </div>
        ) : chunks.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            לא נמצאו קטעים למקור הזה.
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{chunks.length} קטעים</Badge>
              </div>
              {chunks.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed"
                >
                  {c.content}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
