import type { LocalGame } from '../../types/app';
import { createFallbackPoster } from '../../lib/fallbackPoster';
import { createId, normalizeGameName } from '../../lib/gameHelpers';

type PreloadedGame = {
  name: string;
  image?: string;
  imageUrl?: string;
};

type JsonImportGame = {
  name?: unknown;
  image?: unknown;
  imageUrl?: unknown;
};

const STORAGE_KEY = 'manual-boardgame-ranking-v1';

const PRELOADED_GAMES_MODULES = import.meta.glob<{ default: unknown }>('../../data/preloadedGames.json', {
  eager: true,
});

export const JSON_FORMAT_EXAMPLE = `[
  {
    "name": "Brass: Birmingham"
  },
  {
    "name": "Spirit Island"
  }
]`;

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
        const imageUrlSource =
          typeof item.imageUrl === 'string'
            ? item.imageUrl.trim()
            : typeof item.image === 'string'
              ? item.image.trim()
              : '';
        const imageUrl = imageUrlSource.startsWith('data:image/svg+xml') ? createFallbackPoster(name) : imageUrlSource;
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

export const readPreloadedGames = (): LocalGame[] => {
  const preloadedModule = Object.values(PRELOADED_GAMES_MODULES)[0];
  const parsed = preloadedModule?.default;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is PreloadedGame => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<PreloadedGame>;
      return typeof candidate.name === 'string';
    })
    .map((item, index) => {
      const imageSource =
        typeof item.image === 'string'
          ? item.image.trim()
          : typeof item.imageUrl === 'string'
            ? item.imageUrl.trim()
            : '';

      return {
        id: buildSeedId(item.name, index),
        name: item.name.trim(),
        imageUrl: imageSource || createFallbackPoster(item.name),
        createdAt: 0,
      };
    })
    .filter((item) => item.name);
};

export const readInitialGames = (): LocalGame[] => {
  const seededGames = readPreloadedGames();
  const localGames = readLocalGames();

  if (!localGames.length) return seededGames;

  const localByName = new Map(localGames.map((game) => [normalizeGameName(game.name), game]));
  const seededNames = new Set(seededGames.map((game) => normalizeGameName(game.name)));
  const mergedSeeded = seededGames.map((game) => localByName.get(normalizeGameName(game.name)) ?? game);
  const localOnly = localGames.filter((game) => !seededNames.has(normalizeGameName(game.name)));

  return [...mergedSeeded, ...localOnly];
};

export const parseGamesJson = (rawJson: string): LocalGame[] => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON syntax. Check commas, quotes, and brackets.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('JSON root must be an array of game objects.');
  }

  const now = Date.now();
  const imported = parsed
    .filter((item): item is JsonImportGame => !!item && typeof item === 'object')
    .map((item, index) => {
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const imageSource =
        typeof item.image === 'string'
          ? item.image.trim()
          : typeof item.imageUrl === 'string'
            ? item.imageUrl.trim()
            : '';

      if (!name) return null;

      return {
        id: createId(),
        name,
        imageUrl: imageSource || createFallbackPoster(name),
        createdAt: now + index,
      };
    })
    .filter((item): item is LocalGame => item !== null);

  if (!imported.length) {
    throw new Error('No valid entries found. Each game needs at least a "name" field.');
  }

  const deduped = new Map<string, LocalGame>();
  imported.forEach((game) => {
    deduped.set(normalizeGameName(game.name), game);
  });

  return [...deduped.values()];
};

export const mergeGamesByName = (existing: LocalGame[], incoming: LocalGame[]): LocalGame[] => {
  const incomingByName = new Map(incoming.map((game) => [normalizeGameName(game.name), game]));
  const mergedExisting = existing.map((game) => incomingByName.get(normalizeGameName(game.name)) ?? game);
  const existingNames = new Set(mergedExisting.map((game) => normalizeGameName(game.name)));
  const additions = incoming.filter((game) => {
    const key = normalizeGameName(game.name);
    if (existingNames.has(key)) return false;
    existingNames.add(key);
    return true;
  });

  return [...mergedExisting, ...additions];
};

export const buildPreloadJson = (collection: LocalGame[]) =>
  JSON.stringify(
    collection.map((game) => ({
      name: game.name,
      image: game.imageUrl,
    })),
    null,
    2,
  );

export const persistGames = (games: LocalGame[]) => {
  if (typeof window === 'undefined') return;

  if (games.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};
