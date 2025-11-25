import { toast } from '@/hooks/use-toast';

export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export async function shareResults(data: ShareData): Promise<void> {
  // Native Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.href,
      });
      toast({
        title: 'שותף בהצלחה',
        description: 'התוצאות שותפו',
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  } else {
    // Fallback - Copy to clipboard
    try {
      const shareText = `${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      toast({
        title: 'הועתק ללוח',
        description: 'התוצאות הועתקו ללוח - אפשר להדביק בכל מקום',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להעתיק ללוח',
        variant: 'destructive',
      });
    }
  }
}

export function shareViaWhatsApp(text: string): void {
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}

export function shareViaEmail(subject: string, body: string): void {
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

export function shareViaTelegram(text: string): void {
  const encodedText = encodeURIComponent(text);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
  window.open(telegramUrl, '_blank');
}
