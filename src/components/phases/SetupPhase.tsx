import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileDown, Play, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { JSON_FORMAT_EXAMPLE } from '../../features/games/gamesData';
import { shortLabel } from '../../lib/gameHelpers';
import {
  ghostButtonClass,
  innerCardClass,
  inputClass,
  panelClass,
  primaryButtonClass,
} from '../../lib/uiConstants';
import type { LocalGame } from '../../types/app';

type SetupPhaseProps = {
  games: LocalGame[];
  name: string;
  imageUrl: string;
  formError: string;
  jsonText: string;
  jsonError: string;
  jsonNotice: string;
  isJsonPanelOpen: boolean;
  savedAt: Date | null;
  targetTopXInput: string;
  estimatedComparisons: number;
  setupError: string;
  onNameChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onSubmitGame: (event: FormEvent<HTMLFormElement>) => void;
  onToggleJsonPanel: () => void;
  onJsonTextChange: (value: string) => void;
  onImportGamesFromJson: () => void;
  onJsonFileSelected: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSavePreloadJson: () => Promise<void>;
  onResetToPreload: () => void;
  onClearCollection: () => void;
  onTargetTopXInputChange: (value: string) => void;
  onCommitTopXInput: () => void;
  onStartBattle: () => void;
  onRemoveGame: (id: string) => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
};

export function SetupPhase({
  games,
  name,
  imageUrl,
  formError,
  jsonText,
  jsonError,
  jsonNotice,
  isJsonPanelOpen,
  savedAt,
  targetTopXInput,
  estimatedComparisons,
  setupError,
  onNameChange,
  onImageUrlChange,
  onSubmitGame,
  onToggleJsonPanel,
  onJsonTextChange,
  onImportGamesFromJson,
  onJsonFileSelected,
  onSavePreloadJson,
  onResetToPreload,
  onClearCollection,
  onTargetTopXInputChange,
  onCommitTopXInput,
  onStartBattle,
  onRemoveGame,
  onImageError,
}: SetupPhaseProps) {
  const [isClearArmed, setIsClearArmed] = useState(false);

  useEffect(() => {
    if (!isClearArmed) return;

    const timeoutId = window.setTimeout(() => {
      setIsClearArmed(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isClearArmed]);

  const handleClearAllClick = () => {
    if (!games.length) return;

    if (!isClearArmed) {
      setIsClearArmed(true);
      return;
    }

    onClearCollection();
    setIsClearArmed(false);
  };

  return (
    <motion.section
      key="setup"
      className={`${panelClass} space-y-4 p-4 md:p-6`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">Tier List Tournament</p>
        <h1 className="mt-2 text-4xl font-black leading-none text-slate-50 md:text-5xl">Smart duels to find your Favorite Board Games!</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          We use binary-search insertion to find your Top X games with fewer comparisons.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={innerCardClass}>
          <h2 className="text-2xl font-bold text-slate-50">Add a game</h2>
          <form className="mt-3 grid gap-2.5" onSubmit={onSubmitGame}>
            <label htmlFor="game-name" className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Name
            </label>
            <input
              id="game-name"
              className={inputClass}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Brass: Birmingham"
              autoComplete="off"
            />

            <label htmlFor="game-image" className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Image URL (optional)
            </label>
            <input
              id="game-image"
              className={inputClass}
              value={imageUrl}
              onChange={(event) => onImageUrlChange(event.target.value)}
              placeholder="https://..."
              autoComplete="off"
            />

            <button type="submit" className={`${primaryButtonClass} mt-2 justify-center`}>
              <Plus size={18} aria-hidden="true" />
              Add game
            </button>
          </form>

          <AnimatePresence>
            {formError && (
              <motion.p
                className="mt-2 text-sm text-rose-300"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4">
            <button type="button" className={ghostButtonClass} onClick={onToggleJsonPanel}>
              <Upload size={16} />
              {isJsonPanelOpen ? 'Hide JSON import' : 'Import JSON'}
            </button>

            <AnimatePresence initial={false}>
              {isJsonPanelOpen && (
                <motion.div
                  className="mt-2 rounded-2xl border border-slate-500/25 bg-slate-950/40 p-3"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <h3 className="text-base font-bold text-slate-100">Import from JSON</h3>

                  <textarea
                    className={`${inputClass} mt-2 min-h-28 font-mono text-xs`}
                    value={jsonText}
                    onChange={(event) => onJsonTextChange(event.target.value)}
                    placeholder={JSON_FORMAT_EXAMPLE}
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className={ghostButtonClass} onClick={onImportGamesFromJson}>
                      <Upload size={16} />
                      Import JSON
                    </button>

                    <label htmlFor="json-file-upload" className={ghostButtonClass}>
                      <Upload size={16} />
                      Load file
                    </label>
                    <input
                      id="json-file-upload"
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => {
                        void onJsonFileSelected(event);
                      }}
                    />

                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => {
                        void onSavePreloadJson();
                      }}
                      disabled={!games.length}
                    >
                      <FileDown size={16} />
                      Save preload JSON
                    </button>
                  </div>

                  <AnimatePresence>
                    {jsonError && (
                      <motion.p
                        className="mt-2 text-sm text-rose-300"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        {jsonError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {jsonNotice && (
                      <motion.p
                        className="mt-2 text-sm text-emerald-300"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        {jsonNotice}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-2 rounded-xl border border-slate-500/25 bg-slate-900/55 p-3">
                    <p className="mt-2 text-xs text-slate-300">Required field: name. image or imageUrl is optional.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={ghostButtonClass} onClick={onResetToPreload}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset preload
            </button>
            <button
              type="button"
              className={`${ghostButtonClass} ${isClearArmed ? 'border-rose-300/55 bg-rose-900/35 text-rose-100' : ''}`}
              onClick={handleClearAllClick}
              disabled={!games.length}
            >
              <Trash2 size={16} aria-hidden="true" />
              {isClearArmed ? 'Tap again to clear' : 'Clear all'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{savedAt ? `Saved at ${savedAt.toLocaleTimeString()}` : 'Not saved yet'}</p>
        </section>

        <section className={innerCardClass}>
          <h2 className="text-2xl font-bold text-slate-50">Tournament config</h2>

          <label htmlFor="target-top" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-300">
            Top X target
          </label>
          <input
            id="target-top"
            className={`${inputClass} mt-1`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetTopXInput}
            onChange={(event) => onTargetTopXInputChange(event.target.value)}
            onBlur={onCommitTopXInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCommitTopXInput();
              }
            }}
          />

          <p className="mt-2 text-xs text-slate-400">Estimated smart comparisons: ~{estimatedComparisons}.</p>

          <button
            type="button"
            className={`${primaryButtonClass} mt-3 w-full justify-center`}
            onClick={onStartBattle}
            disabled={games.length < 2}
          >
            <Play size={18} aria-hidden="true" />
            Start tournament
          </button>

          <AnimatePresence>
            {setupError && (
              <motion.p
                className="mt-2 text-sm text-rose-300"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {setupError}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="mt-2 text-xs text-slate-400">Collection size: {games.length} games</p>
        </section>
      </div>

      <section className={innerCardClass}>
        <h2 className="text-2xl font-bold text-slate-50">Your games</h2>
        {games.length === 0 ? (
          <div className="mt-3 grid place-content-center rounded-2xl border border-dashed border-slate-500/40 bg-slate-900/35 p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-100">No games in collection.</h3>
            <p className="mt-1 text-sm text-slate-300">Add manually, import JSON, or reset preload to begin.</p>
          </div>
        ) : (
          <ul className="mt-3 grid max-h-[360px] grid-cols-1 gap-2 overflow-auto md:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <li
                key={game.id}
                className="grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-500/30 bg-slate-900/60 p-2"
              >
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  onError={onImageError}
                  className="h-[46px] w-[46px] rounded-lg object-cover"
                />
                <span className="truncate text-sm text-slate-100">{shortLabel(game.name, 28)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveGame(game.id)}
                  aria-label={`Remove ${game.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-500/35 bg-slate-950/75 text-slate-100 transition hover:bg-slate-800"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.section>
  );
}
