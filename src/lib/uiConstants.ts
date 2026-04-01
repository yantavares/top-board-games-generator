export const panelClass =
  'rounded-3xl border border-slate-500/30 bg-slate-900/70 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl';

export const innerCardClass = 'rounded-2xl border border-slate-500/25 bg-slate-950/40 p-4';

export const inputClass =
  'w-full rounded-xl border border-slate-500/35 bg-slate-950/50 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-300/80 focus:ring-2 focus:ring-cyan-300/25';

export const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(249,115,22,0.38)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';

export const ghostButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800/75 disabled:cursor-not-allowed disabled:opacity-50';

export const ambientDots = [
  {
    id: 'd1',
    topClass: 'top-[10%]',
    sizeClass: 'h-3 w-3',
    colorClass: 'bg-orange-300/55',
    duration: 54,
    delay: 0,
  },
  {
    id: 'd2',
    topClass: 'top-[24%]',
    sizeClass: 'h-2.5 w-2.5',
    colorClass: 'bg-cyan-300/55',
    duration: 64,
    delay: -8,
  },
  {
    id: 'd3',
    topClass: 'top-[38%]',
    sizeClass: 'h-3.5 w-3.5',
    colorClass: 'bg-amber-200/45',
    duration: 58,
    delay: -16,
  },
  {
    id: 'd4',
    topClass: 'top-[56%]',
    sizeClass: 'h-2 w-2',
    colorClass: 'bg-teal-200/55',
    duration: 70,
    delay: -22,
  },
  {
    id: 'd5',
    topClass: 'top-[72%]',
    sizeClass: 'h-3 w-3',
    colorClass: 'bg-orange-200/45',
    duration: 62,
    delay: -14,
  },
  {
    id: 'd6',
    topClass: 'top-[86%]',
    sizeClass: 'h-2.5 w-2.5',
    colorClass: 'bg-cyan-200/50',
    duration: 74,
    delay: -30,
  },
];
