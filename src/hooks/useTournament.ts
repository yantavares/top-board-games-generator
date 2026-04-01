export type Game = {
  id: string;
  name: string;
  imageUrl: string;
};

type CandidatePhase = 'gate' | 'search';

export type TournamentState = {
  pool: Game[];
  topX: Game[];
  targetRank: number;
  currentPoolIndex: number;
  // Binary search state:
  bsLow: number;
  bsHigh: number;
  candidatePhase: CandidatePhase;
  comparisonsDone: number;
  comparisonsEstimate: number;
  isFinished: boolean;
};

// Represents the current matchup to show to the user
export type Matchup = {
  gameA: Game; // The game from the pool trying to enter the top X
  gameB: Game; // The game currently in the top X at index `bsMid`
} | null;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const estimateTotalComparisons = (poolSize: number, targetRank: number): number => {
  if (poolSize <= 1) return 0;

  const safeTarget = Math.max(1, targetRank);
  let estimate = 0;
  const acceptedSearchCost = safeTarget <= 1 ? 0 : Math.ceil(Math.log2(safeTarget));

  for (let i = 1; i < poolSize; i += 1) {
    const searchableSize = Math.min(i, safeTarget);

    if (searchableSize < safeTarget) {
      estimate += Math.ceil(Math.log2(searchableSize + 1));
      continue;
    }

    const acceptanceProbability = safeTarget / (i + 1);
    estimate += 1 + acceptanceProbability * acceptedSearchCost;
  }

  return Math.ceil(estimate);
};

const getCandidateWindow = (topXLength: number, targetRank: number) => {
  if (topXLength < targetRank) {
    return {
      candidatePhase: 'search' as const,
      bsLow: 0,
      bsHigh: Math.max(0, topXLength - 1),
    };
  }

  return {
    candidatePhase: 'gate' as const,
    bsLow: 0,
    bsHigh: Math.max(0, targetRank - 2),
  };
};

const advanceCandidate = (state: TournamentState, nextTopX: Game[], comparisonsDone: number): TournamentState => {
  const nextPoolIndex = state.currentPoolIndex + 1;
  const finished = nextPoolIndex >= state.pool.length;
  const window = finished
    ? { candidatePhase: 'search' as const, bsLow: 0, bsHigh: 0 }
    : getCandidateWindow(nextTopX.length, state.targetRank);

  return {
    ...state,
    topX: nextTopX,
    currentPoolIndex: nextPoolIndex,
    candidatePhase: window.candidatePhase,
    bsLow: window.bsLow,
    bsHigh: window.bsHigh,
    comparisonsDone,
    isFinished: finished,
  };
};

export const createInitialState = (pool: Game[], targetRank: number): TournamentState => {
  const safeTargetRank = Math.max(1, Math.min(targetRank, Math.max(1, pool.length)));

  if (pool.length === 0) {
    return {
      pool: [],
      topX: [],
      targetRank: safeTargetRank,
      currentPoolIndex: 0,
      bsLow: 0,
      bsHigh: 0,
      candidatePhase: 'search',
      comparisonsDone: 0,
      comparisonsEstimate: 0,
      isFinished: true,
    };
  }

  const shuffled = shuffle(pool);
  
  const firstGame = shuffled[0];
  const initialWindow = getCandidateWindow(1, safeTargetRank);
  
  return {
    pool: shuffled,
    topX: [firstGame],
    targetRank: safeTargetRank,
    currentPoolIndex: 1,
    bsLow: initialWindow.bsLow,
    bsHigh: initialWindow.bsHigh,
    candidatePhase: initialWindow.candidatePhase,
    comparisonsDone: 0,
    comparisonsEstimate: estimateTotalComparisons(shuffled.length, safeTargetRank),
    isFinished: shuffled.length <= 1,
  };
};

export const getNextMatchup = (state: TournamentState): Matchup => {
  if (state.isFinished || state.currentPoolIndex >= state.pool.length) return null;

  const candidate = state.pool[state.currentPoolIndex];

  if (state.candidatePhase === 'gate') {
    const gateIndex = Math.min(state.targetRank - 1, state.topX.length - 1);
    const opponent = state.topX[gateIndex];

    return {
      gameA: candidate,
      gameB: opponent,
    };
  }

  const bsMid = Math.floor((state.bsLow + state.bsHigh) / 2);
  const opponent = state.topX[bsMid];

  return {
    gameA: candidate,
    gameB: opponent,
  };
};

// Returns the new state after the user decides the winner of the current matchup
// "winner" is either the candidate (gameA) or the topX opponent (gameB)
export const resolveMatchup = (state: TournamentState, winnerId: string): TournamentState => {
  if (state.isFinished || state.currentPoolIndex >= state.pool.length) return state;

  const candidate = state.pool[state.currentPoolIndex];
  const nextComparisonsDone = state.comparisonsDone + 1;

  if (state.candidatePhase === 'gate') {
    const candidateWins = winnerId === candidate.id;

    if (!candidateWins) {
      return advanceCandidate(state, state.topX, nextComparisonsDone);
    }

    if (state.targetRank <= 1) {
      return advanceCandidate(state, [candidate], nextComparisonsDone);
    }

    return {
      ...state,
      candidatePhase: 'search',
      bsLow: 0,
      bsHigh: Math.max(0, state.targetRank - 2),
      comparisonsDone: nextComparisonsDone,
    };
  }

  const bsMid = Math.floor((state.bsLow + state.bsHigh) / 2);
  let newLow = state.bsLow;
  let newHigh = state.bsHigh;

  if (winnerId === candidate.id) {
    newHigh = bsMid - 1;
  } else {
    newLow = bsMid + 1;
  }

  if (newLow > newHigh) {
    let newTopX = [...state.topX];
    newTopX.splice(newLow, 0, candidate);

    if (newTopX.length > state.targetRank) {
      newTopX = newTopX.slice(0, state.targetRank);
    }

    return advanceCandidate(state, newTopX, nextComparisonsDone);
  }

  return {
    ...state,
    bsLow: newLow,
    bsHigh: newHigh,
    comparisonsDone: nextComparisonsDone,
  };
};
