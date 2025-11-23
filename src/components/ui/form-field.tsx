import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  error?: string;
  required?: boolean;
  step?: string;
  helperText?: string;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  step,
  helperText,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        className={cn(
          'transition-colors',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive animate-fade-in">{error}</p>
      )}
    </div>
  );
}