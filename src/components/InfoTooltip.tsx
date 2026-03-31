'use client';
import { useState } from 'react';

interface InfoTooltipProps {
  text: string;
  position?: 'top' | 'bottom';
}

export default function InfoTooltip({ text, position = 'top' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-4 h-4 flex items-center justify-center rounded-full text-[#6E6E73] hover:text-[#D97C4A] transition-colors focus:outline-none"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="6" y="5.5" width="1" height="4" rx="0.5" fill="currentColor"/>
          <rect x="6" y="3.5" width="1" height="1.2" rx="0.5" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <span
          role="tooltip"
          className={`
            pointer-events-none absolute z-50 w-56 rounded-xl border border-[#D2D2D7]
            bg-white px-3 py-2 text-[11px] leading-relaxed text-[#1D1D1F]
            shadow-[0_4px_16px_rgba(0,0,0,0.12)]
            left-1/2 -translate-x-1/2
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {text}
          <span
            className={`
              absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${position === 'top'
                ? 'top-full border-t-[#D2D2D7]'
                : 'bottom-full border-b-[#D2D2D7]'}
            `}
          />
        </span>
      )}
    </span>
  );
}
