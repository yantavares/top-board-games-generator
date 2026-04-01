import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ArrowLeftRight, Swords, Undo2 } from 'lucide-react';
import type { Matchup, TournamentState } from '../../hooks/useTournament';
import { shortLabel } from '../../lib/gameHelpers';
import { ghostButtonClass, panelClass, primaryButtonClass } from '../../lib/uiConstants';

type BattlePhaseProps = {
  tournamentState: TournamentState | null;
  progressPercent: number;
  historyCount: number;
  isResolvingChoice: boolean;
  currentMatchup: Matchup;
  matchupKey: string;
  battleExitDirection: -1 | 0 | 1;
  onUndoLastChoice: () => void;
  onChooseWinner: (winnerId: string) => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
};

export function BattlePhase({
  tournamentState,
  progressPercent,
  historyCount,
  isResolvingChoice,
  currentMatchup,
  matchupKey,
  battleExitDirection,
  onUndoLastChoice,
  onChooseWinner,
  onImageError,
}: BattlePhaseProps) {
  const [winnerPreviewId, setWinnerPreviewId] = useState<string | null>(null);
  const chooseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (chooseTimeoutRef.current !== null) {
        window.clearTimeout(chooseTimeoutRef.current);
      }
    };
  }, []);

  const handleChooseWinner = (winnerId: string) => {
    if (isResolvingChoice || winnerPreviewId) return;

    setWinnerPreviewId(winnerId);
    chooseTimeoutRef.current = window.setTimeout(() => {
      onChooseWinner(winnerId);
      setWinnerPreviewId(null);
      chooseTimeoutRef.current = null;
    }, 120);
  };

  const handleCardDragEnd = (winnerId: string, isLeftCard: boolean, info: PanInfo) => {
    if (isResolvingChoice || winnerPreviewId) return;

    const swipeThreshold = 70;
    const velocityThreshold = 500;
    const didSwipeTowardCard = isLeftCard
      ? info.offset.x <= -swipeThreshold || info.velocity.x <= -velocityThreshold
      : info.offset.x >= swipeThreshold || info.velocity.x >= velocityThreshold;

    if (didSwipeTowardCard) {
      handleChooseWinner(winnerId);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] items-center md:min-h-0">
      <motion.section
        key="battle"
        className={`${panelClass} w-full space-y-4 bg-[radial-gradient(circle_at_20%_15%,rgba(45,212,191,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.2),transparent_40%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7))] p-4 md:p-6`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
      <header className="rounded-2xl border border-slate-500/30 bg-slate-900/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Choose the better game</p>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
          <span>
            Comparison{' '}
            {tournamentState
              ? Math.min(tournamentState.comparisonsDone + 1, tournamentState.comparisonsEstimate)
              : 0}{' '}
            / {' ~'}
            {tournamentState?.comparisonsEstimate ?? 0}
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
            onClick={onUndoLastChoice}
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
            className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
            initial={{ opacity: 0, x: battleExitDirection * -120, scale: 0.97, filter: 'blur(5px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {[currentMatchup.gameA, currentMatchup.gameB].map((game, index) => (
              <motion.article
                key={game.id}
                className="mx-auto grid w-full max-w-[180px] gap-2 rounded-2xl border border-slate-500/30 bg-slate-900/65 p-2.5 shadow-[0_18px_45px_rgba(2,6,23,0.35)] transition hover:-translate-y-0.5 sm:max-w-[210px] md:max-w-xs md:gap-3 md:p-3"
                drag="x"
                dragConstraints={index === 0 ? { left: -140, right: 0 } : { left: 0, right: 140 }}
                dragElastic={0.18}
                whileDrag={{ scale: 1.02 }}
                onDragEnd={(_event, info) => {
                  handleCardDragEnd(game.id, index === 0, info);
                }}
                animate={
                  winnerPreviewId === game.id
                    ? { x: index === 0 ? -240 : 240, opacity: 0, rotate: index === 0 ? -6 : 6 }
                    : winnerPreviewId
                      ? { scale: 0.98, opacity: 0.85 }
                      : { x: 0, opacity: 1, rotate: 0, scale: 1 }
                }
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  onError={onImageError}
                  draggable={false}
                  className="mx-auto h-36 w-full max-w-[132px] rounded-xl object-cover sm:h-44 sm:max-w-[154px] md:h-64 md:max-w-[220px]"
                />
                <h2 className="text-center text-base font-bold text-slate-50 sm:text-lg md:text-xl">{shortLabel(game.name, 24)}</h2>
                <p className="hidden text-center text-xs text-slate-300 md:block">
                  {index === 0 ? 'Left side / Arrow Left' : 'Right side / Arrow Right'}
                </p>
                <button
                  type="button"
                  className={`${primaryButtonClass} w-full justify-center px-2 py-2 text-sm md:px-4 md:py-2.5 md:text-base`}
                  disabled={isResolvingChoice || !!winnerPreviewId}
                  onClick={() => handleChooseWinner(game.id)}
                >
                  <Swords size={18} />
                  Pick
                </button>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="grid place-content-center rounded-2xl border border-dashed border-slate-500/40 bg-slate-900/35 p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-100">Finalizing ranking...</h3>
        </div>
      )}

      <p className="hidden w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-900/20 px-3 py-1.5 text-sm text-cyan-100 md:inline-flex">
        <ArrowLeftRight size={16} />
        Swipe left/right or use keyboard arrows to choose quickly.
      </p>
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-900/20 px-3 py-1.5 text-sm text-cyan-100 md:hidden">
        <ArrowLeftRight size={16} />
        Swipe left/right to choose quickly.
      </p>
      </motion.section>
    </div>
  );
}
