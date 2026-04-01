import { useMemo } from 'react';
import type { KeyboardEvent, RefObject, SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Play, RotateCcw, Undo2 } from 'lucide-react';
import type { Game, TournamentState } from '../../hooks/useTournament';
import { shortLabel } from '../../lib/gameHelpers';
import { ghostButtonClass, inputClass, panelClass, primaryButtonClass } from '../../lib/uiConstants';

type ResultsPhaseProps = {
  topXGames: Game[];
  tournamentState: TournamentState | null;
  resultName: string;
  resultBgColor: string;
  resultBgInput: string;
  exportError: string;
  isExporting: boolean;
  historyCount: number;
  isResolvingChoice: boolean;
  resultsPreviewRef: RefObject<HTMLDivElement | null>;
  onResultNameChange: (value: string) => void;
  onResultBgColorChange: (value: string) => void;
  onResultBgInputChange: (value: string) => void;
  onCommitResultColorInput: () => void;
  onExportResults: () => Promise<void>;
  onUndoLastChoice: () => void;
  onRestartSameCollection: () => void;
  onStartBattle: () => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
};

export function ResultsPhase({
  topXGames,
  tournamentState,
  resultName,
  resultBgColor,
  resultBgInput,
  exportError,
  isExporting,
  historyCount,
  isResolvingChoice,
  resultsPreviewRef,
  onResultNameChange,
  onResultBgColorChange,
  onResultBgInputChange,
  onCommitResultColorInput,
  onExportResults,
  onUndoLastChoice,
  onRestartSameCollection,
  onStartBattle,
  onImageError,
}: ResultsPhaseProps) {
  const podiumStyles = useMemo(
    () =>
      topXGames.map((_, index) => {
        const isFirst = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;

        const rowClass = isFirst
          ? 'border-amber-200/65 bg-gradient-to-r from-amber-300/25 via-amber-100/15 to-slate-900/65'
          : isSecond
            ? 'border-slate-200/50 bg-gradient-to-r from-slate-200/20 via-slate-100/10 to-slate-900/65'
            : isThird
              ? 'border-orange-300/55 bg-gradient-to-r from-orange-300/25 via-orange-200/10 to-slate-900/65'
              : 'border-slate-500/30 bg-slate-900/65';

        const badgeClass = isFirst
          ? 'bg-amber-200/40 text-amber-50'
          : isSecond
            ? 'bg-slate-200/30 text-slate-50'
            : isThird
              ? 'bg-orange-300/35 text-orange-50'
              : 'bg-orange-300/25 text-orange-100';

        return { rowClass, badgeClass };
      }),
    [topXGames],
  );

  return (
    <motion.section
      key="results"
      className={`${panelClass} space-y-4 p-4 md:p-6`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">Tournament complete</p>
        <h1 className="mt-2 text-4xl font-black leading-none text-slate-50 md:text-5xl">Top {topXGames.length}</h1>
        <p className="mt-3 text-sm text-slate-300">
          Ranked with {tournamentState?.comparisonsDone ?? 0} comparisons
          {tournamentState ? ` (estimate ${tournamentState.comparisonsEstimate})` : ''}.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-500/25 bg-slate-950/40 p-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <div className="grid gap-1.5">
          <label htmlFor="result-name" className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Result name
          </label>
          <input
            id="result-name"
            type="text"
            className={inputClass}
            value={resultName}
            onChange={(event) => onResultNameChange(event.target.value)}
            placeholder="My Tier List"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="result-bg-color" className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Background color
          </label>
          <div className="grid grid-cols-[52px_1fr] gap-2">
            <input
              id="result-bg-color"
              type="color"
              className="h-10 w-[52px] cursor-pointer rounded-lg border border-slate-500/35 bg-slate-950/50 p-0"
              value={resultBgColor}
              onChange={(event) => {
                onResultBgColorChange(event.target.value);
                onResultBgInputChange(event.target.value);
              }}
            />
            <input
              type="text"
              className={inputClass}
              value={resultBgInput}
              onChange={(event) => onResultBgInputChange(event.target.value)}
              onBlur={onCommitResultColorInput}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onCommitResultColorInput();
                }
              }}
              placeholder="#1e293b"
            />
          </div>
        </div>

        <button
          type="button"
          className={`${primaryButtonClass} justify-center whitespace-nowrap`}
          onClick={() => {
            void onExportResults();
          }}
          disabled={isExporting}
        >
          <Download size={18} />
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      <AnimatePresence>
        {exportError && (
          <motion.p
            className="text-sm text-rose-300"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {exportError}
          </motion.p>
        )}
      </AnimatePresence>

      <div
        ref={resultsPreviewRef}
        className="rounded-2xl border border-slate-500/25 p-3"
        style={{
          backgroundColor: resultBgColor,
          backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.08), transparent 40%)',
        }}
      >
        <header className="mb-3 rounded-xl border border-slate-500/25 bg-slate-900/55 px-3 py-2">
          <h2 className="truncate text-xl font-black text-slate-50">{resultName.trim() || `Top ${topXGames.length}`}</h2>
        </header>
        <ol className="grid gap-2">
          {topXGames.map((game, index) => {
            const styles = podiumStyles[index];
            return (
              <li
                key={game.id}
                className={`grid grid-cols-[auto_66px_minmax(0,1fr)] items-center gap-2 rounded-2xl border p-2 ${styles.rowClass}`}
              >
                <span className={`rounded-full px-2 py-1 text-xs font-extrabold ${styles.badgeClass}`}>#{index + 1}</span>
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  onError={onImageError}
                  className="h-[66px] w-[66px] rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-50">{shortLabel(game.name, 26)}</h3>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={ghostButtonClass}
          onClick={onUndoLastChoice}
          disabled={historyCount === 0 || isResolvingChoice}
        >
          <Undo2 size={16} />
          Undo last choice
        </button>
        <button type="button" className={ghostButtonClass} onClick={onRestartSameCollection}>
          <RotateCcw size={16} />
          Configure again
        </button>
        <button type="button" className={primaryButtonClass} onClick={onStartBattle}>
          <Play size={18} />
          Run another tournament
        </button>
      </div>
    </motion.section>
  );
}
