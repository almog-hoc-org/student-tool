import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function InfoTooltip({ text, label }: { text: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label ?? 'מידע נוסף'}
          className="inline-flex text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
