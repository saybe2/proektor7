// Простые SVG-иконки (вместо эмодзи)

type P = { className?: string };
const base = "w-6 h-6";

export function IconMic({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 18v4M8 22h8" />
    </svg>
  );
}

export function IconDice({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconProjector({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="9" rx="2" />
      <circle cx="16" cy="12.5" r="2.5" />
      <path d="M6 11h4M6 14h2" />
      <path d="M7 20l-1 1M17 20l1 1" />
    </svg>
  );
}

export function IconCup({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8z" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3.5c0 .8.8 1 .8 1.8S8 6.5 8 6.5M12 3.5c0 .8.8 1 .8 1.8s-.8 1.2-.8 1.2" />
    </svg>
  );
}

export function IconUsers({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-5-6.3" />
    </svg>
  );
}

export function IconGift({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13" />
      <path d="M12 8c-2 0-4.5-.6-4.5-2.7C7.5 3.6 9 3 10 3c2 0 2 3 2 5zM12 8c2 0 4.5-.6 4.5-2.7C16.5 3.6 15 3 14 3c-2 0-2 3-2 5z" />
    </svg>
  );
}

export function IconPercent({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5L5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}

export function IconCard({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}

export function IconBell({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCake({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21h16M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
      <path d="M5 17c1.5 1 2.5-1 4 0s2.5-1 4 0 2.5-1 4 0" />
      <path d="M12 9v4M12 6a1.5 1.5 0 0 0 1.5-1.5C13.5 3 12 2 12 2s-1.5 1-1.5 2.5A1.5 1.5 0 0 0 12 6z" />
    </svg>
  );
}

export function IconClock({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconMapPin({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconPhone({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function IconEdit({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" />
    </svg>
  );
}

export function IconVolume({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function IconMusic({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function IconSofa({ className }: P) {
  return (
    <svg className={className || base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
      <path d="M3 14a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3z" />
      <path d="M5 19v2M19 19v2" />
    </svg>
  );
}
