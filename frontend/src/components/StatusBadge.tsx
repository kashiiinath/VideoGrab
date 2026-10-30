import React from 'react';
import { CheckCircle2, XCircle, Clock, Ban, Loader2, PlayCircle } from 'lucide-react';

type Status = string;

const cfg: Record<string, { label: string; bg: string; text: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  pending:    { label: 'Pending',    bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400',   icon: Clock },
  ready:      { label: 'Ready',      bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400',     icon: PlayCircle },
  processing: { label: 'Downloading',bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-400', icon: Loader2 },
  completed:  { label: 'Saved',      bg: 'bg-green-100 dark:bg-green-900/30',    text: 'text-green-700 dark:text-green-400',   icon: CheckCircle2 },
  failed:     { label: 'Failed',     bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-600 dark:text-red-400',       icon: XCircle },
  cancelled:  { label: 'Cancelled',  bg: 'bg-neutral-100 dark:bg-neutral-800',   text: 'text-neutral-500 dark:text-neutral-400', icon: Ban },
  started:    { label: 'Started',    bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400',     icon: PlayCircle },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = cfg[status] ?? cfg.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <Icon size={10} className={status === 'processing' ? 'animate-spin' : ''} />
      {c.label}
    </span>
  );
}
