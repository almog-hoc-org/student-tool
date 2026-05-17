import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  title?: string;
  description?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('UI boundary caught an error', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {this.props.description ?? 'לא הצלחנו להציג את ההודעה הזו.'}
        </div>
      );
    }

    return (
      <div dir="rtl" className="rounded-2xl border bg-card p-6 text-center space-y-3">
        <AlertCircle className="w-7 h-7 text-amber-500 mx-auto" />
        <h3 className="font-semibold">{this.props.title ?? 'משהו השתבש בתצוגה'}</h3>
        <p className="text-sm text-muted-foreground">
          {this.props.description ?? 'אפשר לרענן את הדף ולהמשיך לעבוד.'}
        </p>
        <Button size="sm" onClick={() => window.location.reload()}>
          רענן עמוד
        </Button>
      </div>
    );
  }
}
