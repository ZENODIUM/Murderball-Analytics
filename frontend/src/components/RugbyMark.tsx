export default function RugbyMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" role="img" aria-label="Rugby ball">
      <g transform="rotate(-35 24 24)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="24" cy="24" rx="11" ry="17" strokeWidth="2.8" />
        <path d="M24 13v22M19 19h10M19 24h10M19 29h10" strokeWidth="2" />
        <path d="M17 12c4 2 10 2 14 0M17 36c4-2 10-2 14 0" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
