import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  buildPreloadJson,
  mergeGamesByName,
  parseGamesJson,
  persistGames,
  readInitialGames,
  readPreloadedGames,
} from '../features/games/gamesData';
import { createFallbackPoster } from '../lib/fallbackPoster';
import { createId, normalizeGameName } from '../lib/gameHelpers';
import type { LocalGame } from '../types/app';

export function useGameCollection() {
  const [games, setGames] = useState<LocalGame[]>(readInitialGames);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonNotice, setJsonNotice] = useState('');
  const [isJsonPanelOpen, setIsJsonPanelOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    persistGames(games);
    setSavedAt(new Date());
  }, [games]);

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
        imageUrl: cleanImageUrl || createFallbackPoster(cleanName),
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
    setGames([]);
  };

  const importGamesFromJson = () => {
    setJsonError('');
    setJsonNotice('');

    const trimmed = jsonText.trim();
    if (!trimmed) {
      setJsonError('Paste JSON first, then click Import JSON.');
      return;
    }

    try {
      const importedGames = parseGamesJson(trimmed);
      setGames((previous) => mergeGamesByName(previous, importedGames));
      setJsonNotice(`Imported ${importedGames.length} game${importedGames.length === 1 ? '' : 's'} from JSON.`);
      setJsonText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import JSON.';
      setJsonError(message);
    }
  };

  const onJsonFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonText(text);
      setJsonError('');
      setJsonNotice(`Loaded ${file.name}. Review it, then click Import JSON.`);
    } catch {
      setJsonError('Could not read that file.');
      setJsonNotice('');
    } finally {
      event.target.value = '';
    }
  };

  const savePreloadJson = async () => {
    setJsonError('');
    setJsonNotice('');

    if (!games.length) {
      setJsonError('Add at least one game before saving preload JSON.');
      return;
    }

    const content = buildPreloadJson(games);
    const pickerWindow = window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string;
        types?: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<{
        createWritable: () => Promise<{
          write: (data: string) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    };

    if (typeof pickerWindow.showSaveFilePicker === 'function') {
      try {
        const handle = await pickerWindow.showSaveFilePicker({
          suggestedName: 'preloadedGames.json',
          types: [
            {
              description: 'JSON file',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        setJsonNotice('Preload JSON saved. Place it at src/data/preloadedGames.json.');
        return;
      } catch {
        // Falls back to a browser download if picker is canceled or blocked.
      }
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'preloadedGames.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setJsonNotice('Downloaded preloadedGames.json. Move it to src/data/preloadedGames.json.');
  };

  const resetToPreload = () => {
    if (window.confirm('Reset to local preloaded games only? (If none exist, this will clear your collection.)')) {
      setGames(readPreloadedGames());
    }
  };

  return {
    games,
    name,
    imageUrl,
    formError,
    jsonText,
    jsonError,
    jsonNotice,
    isJsonPanelOpen,
    savedAt,
    setName,
    setImageUrl,
    setJsonText,
    setIsJsonPanelOpen,
    submitGame,
    removeGame,
    clearCollection,
    importGamesFromJson,
    onJsonFileSelected,
    savePreloadJson,
    resetToPreload,
  };
}
