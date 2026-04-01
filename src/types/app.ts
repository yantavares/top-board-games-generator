import type { Game as TournamentGame } from '../hooks/useTournament';

export type LocalGame = {
  id: TournamentGame['id'];
  name: TournamentGame['name'];
  imageUrl: TournamentGame['imageUrl'];
  createdAt: number;
};

export type AppPhase = 'setup' | 'battle' | 'results';
