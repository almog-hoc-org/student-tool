import { cn } from '@/lib/utils';

/**
 * "הדרך לדירה" logomark — a house silhouette whose doorway forms a path
 * leading in. Drawn inline so it themes via currentColor.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-8 h-8', className)}
      aria-hidden="true"
    >
      {/* roof */}
      <path
        d="M4 14.5 16 5l12 9.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* walls */}
      <path
        d="M7.5 14v12.5h17V14"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the path — steps leading to the doorway */}
      <path
        d="M13 26.5v-4h6v4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="1.6" fill="currentColor" />
    </svg>
  );
}
