import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Download, Play, Plus, RotateCcw, Swords, Trash2, Undo2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  createInitialState,
  estimateTotalComparisons,
  getNextMatchup,
  resolveMatchup,
  type Game as TournamentGame,
  type TournamentState,
} from './hooks/useTournament';

type LocalGame = {
  id: TournamentGame['id'];
  name: TournamentGame['name'];
  imageUrl: TournamentGame['imageUrl'];
  createdAt: number;
};

type PreloadedGame = {
  name: string;
  image: string;
};

type AppPhase = 'setup' | 'battle' | 'results';

const STORAGE_KEY = 'manual-boardgame-ranking-v1';
const PRELOADED_GAMES_MODULES = import.meta.glob<{ default: unknown }>('./data/preloadedGames.json', {
  eager: true,
});

const FALLBACK_POSTER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#163e63'/>
        <stop offset='1' stop-color='#0f172a'/>
      </linearGradient>
    </defs>
    <rect width='600' height='400' fill='url(#g)'/>
    <text x='50%' y='48%' text-anchor='middle' dominant-baseline='middle' font-family='Outfit, sans-serif' font-size='34' fill='#dbeafe'>No image</text>
    <text x='50%' y='58%' text-anchor='middle' dominant-baseline='middle' font-family='Outfit, sans-serif' font-size='18' fill='#93c5fd'>Check the URL</text>
  </svg>`,
)}`;

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalizeGameName = (value: string) => value.trim().toLowerCase();
const isValidHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

const panelClass =
  'rounded-3xl border border-slate-500/30 bg-slate-900/70 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl';
const innerCardClass = 'rounded-2xl border border-slate-500/25 bg-slate-950/40 p-4';
const inputClass =
  'w-full rounded-xl border border-slate-500/35 bg-slate-950/50 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-300/80 focus:ring-2 focus:ring-cyan-300/25';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(249,115,22,0.38)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';
const ghostButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800/75 disabled:cursor-not-allowed disabled:opacity-50';

const ambientDots = [
  { id: 'd1', topClass: 'top-[10%]', sizeClass: 'h-3 w-3', colorClass: 'bg-orange-300/55', duration: 54, delay: 0 },
  { id: 'd2', topClass: 'top-[24%]', sizeClass: 'h-2.5 w-2.5', colorClass: 'bg-cyan-300/55', duration: 64, delay: -8 },
  { id: 'd3', topClass: 'top-[38%]', sizeClass: 'h-3.5 w-3.5', colorClass: 'bg-amber-200/45', duration: 58, delay: -16 },
  { id: 'd4', topClass: 'top-[56%]', sizeClass: 'h-2 w-2', colorClass: 'bg-teal-200/55', duration: 70, delay: -22 },
  { id: 'd5', topClass: 'top-[72%]', sizeClass: 'h-3 w-3', colorClass: 'bg-orange-200/45', duration: 62, delay: -14 },
  { id: 'd6', topClass: 'top-[86%]', sizeClass: 'h-2.5 w-2.5', colorClass: 'bg-cyan-200/50', duration: 74, delay: -30 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const buildSeedId = (name: string, index: number) => {
  const slug = normalizeGameName(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `seed-${index}-${slug || 'game'}`;
};

const readLocalGames = (): LocalGame[] => {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => {
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const imageUrl =
          typeof item.imageUrl === 'string'
            ? item.imageUrl.trim()
            : typeof item.image === 'string'
              ? item.image.trim()
              : '';
        const id = typeof item.id === 'string' ? item.id : createId();
        const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();

        if (!name || !imageUrl) return null;
        return { id, name, imageUrl, createdAt };
      })
      .filter((item): item is LocalGame => item !== null);
  } catch {
    return [];
  }
};

const readPreloadedGames = (): LocalGame[] => {
  // Local-only preload file is optional and can be absent in deployments.
  const preloadedModule = Object.values(PRELOADED_GAMES_MODULES)[0];
  const parsed = preloadedModule?.default;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is PreloadedGame => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<PreloadedGame>;
      return typeof candidate.name === 'string' && typeof candidate.image === 'string';
    })
    .map((item, index) => ({
      id: buildSeedId(item.name, index),
      name: item.name.trim(),
      imageUrl: item.image.trim(),
      createdAt: 0,
    }))
    .filter((item) => item.name && item.imageUrl);
};

const readInitialGames = (): LocalGame[] => {
  const seededGames = readPreloadedGames();
  const localGames = readLocalGames();

  if (!localGames.length) return seededGames;

  const localByName = new Map(localGames.map((game) => [normalizeGameName(game.name), game]));
  const seededNames = new Set(seededGames.map((game) => normalizeGameName(game.name)));
  const mergedSeeded = seededGames.map((game) => localByName.get(normalizeGameName(game.name)) ?? game);
  const localOnly = localGames.filter((game) => !seededNames.has(normalizeGameName(game.name)));

  return [...mergedSeeded, ...localOnly];
};

const cloneTournamentState = (state: TournamentState): TournamentState => ({
  ...state,
  pool: state.pool.map((game) => ({ ...game })),
  topX: state.topX.map((game) => ({ ...game })),
});

function App() {
  const [games, setGames] = useState<LocalGame[]>(readInitialGames);
  const [phase, setPhase] = useState<AppPhase>('setup');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [targetTopX, setTargetTopX] = useState(10);
  const [targetTopXInput, setTargetTopXInput] = useState('10');
  const [setupError, setSetupError] = useState('');
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [resultName, setResultName] = useState('My Tier List');
  const [resultBgColor, setResultBgColor] = useState('#1e293b');
  const [resultBgInput, setResultBgInput] = useState('#1e293b');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [battleExitDirection, setBattleExitDirection] = useState<-1 | 0 | 1>(0);
  const [isResolvingChoice, setIsResolvingChoice] = useState(false);
  const resultsPreviewRef = useRef<HTMLDivElement | null>(null);
  const resolveTimeoutRef = useRef<number | null>(null);
  const historyRef = useRef<TournamentState[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    setSavedAt(new Date());
  }, [games]);

  useEffect(() => {
    setTargetTopX((prev) => clamp(prev, 1, games.length));
  }, [games.length]);

  useEffect(() => {
    setTargetTopXInput(String(targetTopX));
  }, [targetTopX]);

  const safeTopX = clamp(targetTopX, 1, Math.max(1, games.length || 1));
  const estimatedComparisons = useMemo(
    () => estimateTotalComparisons(games.length, safeTopX),
    [games.length, safeTopX],
  );

  const currentMatchup = useMemo(() => {
    if (phase !== 'battle' || !tournamentState) return null;
    return getNextMatchup(tournamentState);
  }, [phase, tournamentState]);

  const progressPercent = useMemo(() => {
    if (!tournamentState) return 0;
    if (tournamentState.comparisonsEstimate <= 0) return 100;

    return Math.min(100, Math.round((tournamentState.comparisonsDone / tournamentState.comparisonsEstimate) * 100));
  }, [tournamentState]);

  const topXGames = tournamentState?.topX ?? [];

  const matchupKey = currentMatchup
    ? `${currentMatchup.gameA.id}-${currentMatchup.gameB.id}-${tournamentState?.comparisonsDone ?? 0}`
    : 'no-matchup';

  useEffect(() => {
    if (phase === 'battle' && tournamentState?.isFinished) {
      setPhase('results');
    }
  }, [phase, tournamentState]);

  const submitGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    const cleanImageUrl = imageUrl.trim();

    if (!cleanName) {
      setFormError('Please provide a game name.');
      return;
    }

    if (cleanImageUrl) {
      try {
        new URL(cleanImageUrl);
      } catch {
        setFormError('Image must be a valid URL.');
        return;
      }
    }

    if (games.some((game) => normalizeGameName(game.name) === normalizeGameName(cleanName))) {
      setFormError('This game already exists in your collection.');
      return;
    }

    setGames((previous) => [
      ...previous,
      {
        id: createId(),
        name: cleanName,
        imageUrl: cleanImageUrl || FALLBACK_POSTER,
        createdAt: Date.now(),
      },
    ]);

    setName('');
    setImageUrl('');
  };

  const removeGame = (id: string) => {
    setGames((previous) => previous.filter((game) => game.id !== id));
  };

  const clearCollection = () => {
    if (!games.length) return;
    if (window.confirm('Remove all games from your collection?')) {
      setGames([]);
    }
  };

  const resetToPreload = () => {
    if (window.confirm('Reset to local preloaded games only? (If none exist, this will clear your collection.)')) {
      setGames(readPreloadedGames());
    }
  };

  const startBattle = () => {
    setSetupError('');

    if (games.length < 2) {
      setSetupError('Add at least 2 games to start the tournament.');
      return;
    }

    const pool: TournamentGame[] = games.map((game) => ({
      id: game.id,
      name: game.name,
      imageUrl: game.imageUrl,
    }));
    const nextState = createInitialState(pool, safeTopX);

    historyRef.current = [];
    setHistoryCount(0);
    if (resolveTimeoutRef.current !== null) {
      window.clearTimeout(resolveTimeoutRef.current);
      resolveTimeoutRef.current = null;
    }
    setIsResolvingChoice(false);
    setTournamentState(nextState);
    setResultName(`Top ${safeTopX} Board Games`);
    setPhase(nextState.isFinished ? 'results' : 'battle');
  };

  const commitTopXInput = () => {
    const parsed = Number.parseInt(targetTopXInput, 10);
    if (Number.isNaN(parsed)) {
      setTargetTopX((prev) => clamp(prev, 1, Math.max(1, games.length || 1)));
      return;
    }

    setTargetTopX(clamp(parsed, 1, Math.max(1, games.length || 1)));
  };

  const chooseWinner = useCallback((winnerId: string) => {
    if (!currentMatchup || !tournamentState || isResolvingChoice) return;

    const direction: -1 | 1 = winnerId === currentMatchup.gameA.id ? -1 : 1;
    historyRef.current.push(cloneTournamentState(tournamentState));
    setHistoryCount(historyRef.current.length);
    setIsResolvingChoice(true);
    setBattleExitDirection(direction);

    resolveTimeoutRef.current = window.setTimeout(() => {
      setTournamentState((previous) => {
        if (!previous) return previous;
        return resolveMatchup(previous, winnerId);
      });
      setBattleExitDirection(0);
      setIsResolvingChoice(false);
      resolveTimeoutRef.current = null;
    }, 220);
  }, [currentMatchup, isResolvingChoice, tournamentState]);

  const undoLastChoice = useCallback(() => {
    if (isResolvingChoice || historyRef.current.length === 0) return;

    const previousState = historyRef.current.pop();
    if (!previousState) return;

    setHistoryCount(historyRef.current.length);
    setTournamentState(previousState);
    setPhase('battle');
  }, [isResolvingChoice]);

  const commitResultColorInput = () => {
    if (isValidHexColor(resultBgInput)) {
      setResultBgColor(resultBgInput);
      return;
    }

    setResultBgInput(resultBgColor);
  };

  const exportResults = async () => {
    if (!topXGames.length || !resultsPreviewRef.current || isExporting) return;

    const exportName = resultName.trim() || `Top ${topXGames.length}`;
    const fileNameBase =
      exportName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'tier-list-results';

    setExportError('');
    setIsExporting(true);

    try {
      const dataUrl = await toPng(resultsPreviewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `${fileNameBase}.png`;
      anchor.click();
    } catch {
      setExportError('Could not export PNG. Some image URLs may block image capture due to CORS restrictions.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (phase !== 'battle' || !currentMatchup) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isResolvingChoice) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        chooseWinner(currentMatchup.gameA.id);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        chooseWinner(currentMatchup.gameB.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chooseWinner, currentMatchup, isResolvingChoice, phase]);

  useEffect(() => {
    return () => {
      if (resolveTimeoutRef.current !== null) {
        window.clearTimeout(resolveTimeoutRef.current);
      }
    };
  }, []);

  const restartSameCollection = () => {
    setPhase('setup');
    setSetupError('');
  };

  const onImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const image = event.currentTarget;
    image.onerror = null;
    image.src = FALLBACK_POSTER;
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8">
      {ambientDots.map((dot) => (
        <motion.span
          key={dot.id}
          aria-hidden="true"
          className={`pointer-events-none absolute -left-12 ${dot.topClass} ${dot.sizeClass} ${dot.colorClass} rounded-full blur-[1px]`}
          initial={{ x: '-8vw' }}
          animate={{ x: ['-8vw', '110vw'] }}
          transition={{
            duration: dot.duration,
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'loop',
            delay: dot.delay,
          }}
        />
      ))}

      <main className="relative z-10 mx-auto w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.section
              key="setup"
              className={`${panelClass} space-y-4 p-4 md:p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">Tier List Tournament</p>
                <h1 className="mt-2 text-4xl font-black leading-none text-slate-50 md:text-5xl">Smart duels to find your Top X.</h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-300">
                  JSON preload is loaded first, then local storage is merged. Matchups use binary search insertion,
                  minimizing the number of comparisons needed.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className={innerCardClass}>
                  <h2 className="text-2xl font-bold text-slate-50">Add a game</h2>
                  <form className="mt-3 grid gap-2.5" onSubmit={submitGame}>
                    <label htmlFor="game-name" className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Name
                    </label>
                    <input
                      id="game-name"
                      className={inputClass}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
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
                      onChange={(event) => setImageUrl(event.target.value)}
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={ghostButtonClass} onClick={resetToPreload}>
                      <RotateCcw size={16} aria-hidden="true" />
                      Reset preload
                    </button>
                    <button type="button" className={ghostButtonClass} onClick={clearCollection} disabled={!games.length}>
                      <Trash2 size={16} aria-hidden="true" />
                      Clear all
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
                    onChange={(event) => setTargetTopXInput(event.target.value.replace(/\D/g, ''))}
                    onBlur={commitTopXInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        commitTopXInput();
                      }
                    }}
                  />

                  <p className="mt-2 text-xs text-slate-400">Estimated smart comparisons: ~{estimatedComparisons}.</p>

                  <button
                    type="button"
                    className={`${primaryButtonClass} mt-3 w-full justify-center`}
                    onClick={startBattle}
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
                    <p className="mt-1 text-sm text-slate-300">Add games or reset to preload to begin.</p>
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
                        <span className="truncate text-sm text-slate-100">{game.name}</span>
                        <button
                          type="button"
                          onClick={() => removeGame(game.id)}
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
          )}

          {phase === 'battle' && (
            <motion.section
              key="battle"
              className={`${panelClass} space-y-4 bg-[radial-gradient(circle_at_20%_15%,rgba(45,212,191,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.2),transparent_40%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7))] p-4 md:p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <header className="rounded-2xl border border-slate-500/30 bg-slate-900/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Choose the better game</p>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
                  <span>
                    Comparison {tournamentState ? Math.min(tournamentState.comparisonsDone + 1, tournamentState.comparisonsEstimate) : 0} /
                    {' ~'}{tournamentState?.comparisonsEstimate ?? 0}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-700/90">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-teal-400 transition-[width] duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className={ghostButtonClass}
                    onClick={undoLastChoice}
                    disabled={historyCount === 0 || isResolvingChoice}
                  >
                    <Undo2 size={16} />
                    Undo last choice
                  </button>
                </div>
              </header>

              {currentMatchup ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={matchupKey}
                    className="grid cursor-grab gap-4 active:cursor-grabbing md:grid-cols-2"
                    initial={{ opacity: 0, x: battleExitDirection * -120, scale: 0.97, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: battleExitDirection * 180, scale: 0.96, filter: 'blur(6px)' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    drag="x"
                    dragElastic={0.15}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_event, info) => {
                      if (isResolvingChoice || !currentMatchup) return;

                      if (info.offset.x <= -110) {
                        chooseWinner(currentMatchup.gameA.id);
                      } else if (info.offset.x >= 110) {
                        chooseWinner(currentMatchup.gameB.id);
                      }
                    }}
                  >
                    {[currentMatchup.gameA, currentMatchup.gameB].map((game, index) => (
                      <article
                        key={game.id}
                        className="mx-auto grid w-full max-w-xs gap-3 rounded-2xl border border-slate-500/30 bg-slate-900/65 p-3 shadow-[0_18px_45px_rgba(2,6,23,0.35)] transition hover:-translate-y-0.5"
                      >
                        <img
                          src={game.imageUrl}
                          alt={game.name}
                          onError={onImageError}
                          draggable={false}
                          className="mx-auto h-64 w-full max-w-[220px] rounded-xl object-cover"
                        />
                        <h2 className="text-center text-xl font-bold text-slate-50">{game.name}</h2>
                        <p className="text-center text-xs text-slate-300">
                          {index === 0 ? 'Left side / Arrow Left' : 'Right side / Arrow Right'}
                        </p>
                        <button
                          type="button"
                          className={`${primaryButtonClass} w-full justify-center`}
                          disabled={isResolvingChoice}
                          onClick={() => chooseWinner(game.id)}
                        >
                          <Swords size={18} />
                          Pick this one
                        </button>
                      </article>
                    ))}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="grid place-content-center rounded-2xl border border-dashed border-slate-500/40 bg-slate-900/35 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-100">Finalizing ranking...</h3>
                </div>
              )}

              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-900/20 px-3 py-1.5 text-sm text-cyan-100">
                <ArrowLeftRight size={16} />
                Swipe left/right or use keyboard arrows to choose quickly.
              </p>
            </motion.section>
          )}

          {phase === 'results' && (
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
                    onChange={(event) => setResultName(event.target.value)}
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
                        setResultBgColor(event.target.value);
                        setResultBgInput(event.target.value);
                      }}
                    />
                    <input
                      type="text"
                      className={inputClass}
                      value={resultBgInput}
                      onChange={(event) => setResultBgInput(event.target.value)}
                      onBlur={commitResultColorInput}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          commitResultColorInput();
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
                    void exportResults();
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
                  {topXGames.map((game, index) => (
                    <li
                      key={game.id}
                      className="grid grid-cols-[auto_66px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-500/30 bg-slate-900/65 p-2"
                    >
                      <span className="rounded-full bg-orange-300/25 px-2 py-1 text-xs font-extrabold text-orange-100">
                        #{index + 1}
                      </span>
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        onError={onImageError}
                        className="h-[66px] w-[66px] rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-50">{game.name}</h3>
                        <p className="text-xs text-slate-300">Position decided via binary insertion tournament</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={undoLastChoice}
                  disabled={historyCount === 0 || isResolvingChoice}
                >
                  <Undo2 size={16} />
                  Undo last choice
                </button>
                <button type="button" className={ghostButtonClass} onClick={restartSameCollection}>
                  <RotateCcw size={16} />
                  Configure again
                </button>
                <button type="button" className={primaryButtonClass} onClick={startBattle}>
                  <Play size={18} />
                  Run another tournament
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
