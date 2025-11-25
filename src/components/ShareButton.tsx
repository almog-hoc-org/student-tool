import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, MessageCircle, Mail, Send, Copy } from 'lucide-react';
import { shareResults, shareViaWhatsApp, shareViaEmail, shareViaTelegram } from '@/lib/utils/share';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url || window.location.href}`);
      toast({
        title: 'הועתק ללוח',
        description: 'התוצאות הועתקו בהצלחה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להעתיק ללוח',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          שתף תוצאות
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => shareResults({ title, text, url })}>
          <Share2 className="ml-2 h-4 w-4" />
          שתף...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareViaWhatsApp(`${title}\n\n${text}`)}>
          <MessageCircle className="ml-2 h-4 w-4 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareViaTelegram(text)}>
          <Send className="ml-2 h-4 w-4 text-blue-500" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareViaEmail(title, text)}>
          <Mail className="ml-2 h-4 w-4 text-orange-600" />
          אימייל
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="ml-2 h-4 w-4" />
          העתק ללוח
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
