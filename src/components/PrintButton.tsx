'use client';

export function PrintButton({ label = 'Распечатать' }: { label?: string }) {
  return (
    <button type="button" className="btn btn--ghost noprint" onClick={() => window.print()}>
      {label}
    </button>
  );
}
