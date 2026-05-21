// Inline SVG icons matching Lucide paths - 18px default, 1.5px stroke
import React from 'react';

type P = { size?: number; className?: string; style?: React.CSSProperties };

const I = ({ size = 18, className, style, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {children}
  </svg>
);

export const Pause = (p: P) => <I {...p}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></I>;
export const Play = (p: P) => <I {...p}><polygon points="6 3 20 12 6 21 6 3" /></I>;
export const BookOpen = (p: P) => <I {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></I>;
export const Backpack = (p: P) => <I {...p}><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" /><path d="M9 6V4a3 3 0 0 1 6 0v2" /><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" /><path d="M8 10h8" /></I>;
export const Settings = (p: P) => <I {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></I>;
export const LogOut = (p: P) => <I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></I>;
export const ArrowUp = (p: P) => <I {...p}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></I>;
export const ChevronDown = (p: P) => <I {...p}><path d="m6 9 6 6 6-6" /></I>;
export const X = (p: P) => <I {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></I>;
export const AlertCircle = (p: P) => <I {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></I>;
export const CheckCircle = (p: P) => <I {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></I>;
export const Info = (p: P) => <I {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></I>;
export const AlertTriangle = (p: P) => <I {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></I>;
