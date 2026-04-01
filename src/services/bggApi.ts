import type { Game } from '../hooks/useTournament';

export const fetchUserCollection = async (): Promise<Game[]> => {
  throw new Error('BGG API integration was removed. Add games manually in the local app UI.');
};
