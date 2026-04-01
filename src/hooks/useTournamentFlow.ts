import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { cloneTournamentState } from '../features/tournament/stateUtils';
import { clamp, isValidHexColor } from '../lib/gameHelpers';
import {
  createInitialState,
  estimateTotalComparisons,
  getNextMatchup,
  resolveMatchup,
  type Game as TournamentGame,
  type TournamentState,
} from './useTournament';
import type { AppPhase, LocalGame } from '../types/app';

export function useTournamentFlow(games: LocalGame[]) {
  const [phase, setPhase] = useState<AppPhase>('setup');
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

  const chooseWinner = useCallback(
    (winnerId: string) => {
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
    },
    [currentMatchup, isResolvingChoice, tournamentState],
  );

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

  return {
    phase,
    targetTopXInput,
    setupError,
    tournamentState,
    resultName,
    resultBgColor,
    resultBgInput,
    exportError,
    isExporting,
    battleExitDirection,
    isResolvingChoice,
    resultsPreviewRef,
    historyCount,
    estimatedComparisons,
    progressPercent,
    topXGames,
    currentMatchup,
    matchupKey,
    setTargetTopXInput,
    setResultName,
    setResultBgColor,
    setResultBgInput,
    startBattle,
    commitTopXInput,
    chooseWinner,
    undoLastChoice,
    commitResultColorInput,
    exportResults,
    restartSameCollection,
  };
}
