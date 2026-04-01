import type { TournamentState } from '../../hooks/useTournament';

export const cloneTournamentState = (state: TournamentState): TournamentState => ({
  ...state,
  pool: state.pool.map((game) => ({ ...game })),
  topX: state.topX.map((game) => ({ ...game })),
});
