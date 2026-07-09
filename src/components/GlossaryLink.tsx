import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BookOpen } from 'lucide-react';
import { GLOSSARY, type TermKey } from '@/lib/glossary';
import { logUsageEvent } from '@/lib/cloud-storage';
import { useAuth } from '@/contexts/AuthContext';

interface GlossaryLinkProps {
  term: TermKey;
  children?: ReactNode;
  className?: string;
}

export function GlossaryLink({ term, children, className }: GlossaryLinkProps) {
  const entry = GLOSSARY[term];
  const { user } = useAuth();

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && user?.id) {
          void logUsageEvent(user.id, 'glossary', `glossary_open:${term}`);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            'inline-flex items-center gap-0.5 text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid text-inherit ' +
            (className ?? '')
          }
        >
          {children ?? entry.term}
          <BookOpen className="w-3 h-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="max-w-xs space-y-2" dir="rtl">
        <p className="font-semibold text-sm">{entry.term}</p>
        <p className="text-xs text-muted-foreground">{entry.short}</p>
        <details className="text-xs">
          <summary className="cursor-pointer text-primary">
            קרא עוד
          </summary>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            {entry.long}
          </p>
        </details>
        <Link
          to="/glossary"
          className="block border-t pt-2 text-xs text-primary hover:underline"
        >
          לכל מילון המושגים ←
        </Link>
      </PopoverContent>
    </Popover>
  );
}
