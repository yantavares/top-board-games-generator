# BGG Tier List (Local-First)

A local-first board game tier-list app built with React, TypeScript, Vite, Framer Motion, and Tailwind.

No BGG API is used. You manage your own collection, run head-to-head comparisons, and generate a Top X ranking.

## What This App Does

- Optionally preloads games from a local-only file: `src/data/preloadedGames.json`
- Merges optional preloaded data with your `localStorage` collection
- Starts with an empty collection when no preloaded file exists
- Lets you add games manually (image URL optional)
- Runs a comparison tournament to find Top X
- Supports click, swipe, and keyboard arrows during battles
- Lets you customize result name + background color
- Exports results as a PNG image

## Ranking Logic (Smart Top X)

The ranking engine is optimized to reduce unnecessary comparisons.

1. While Top X is still filling:
   - New candidates are inserted via binary-search-style comparisons.
2. After Top X is full:
   - Candidate is first compared against the current X-th ranked game.
   - If candidate loses, it is discarded immediately.
   - If candidate wins, only then it is compared upward to find final position.

This significantly cuts user decisions once Top X stabilizes.

## Controls During Battle

- Click `Pick this one` on either card
- Swipe left/right on the matchup area
- Press keyboard arrows:
  - Left Arrow selects left card
  - Right Arrow selects right card

## Data Source and Persistence

- Source order at startup:
  1. Optional preloaded JSON (`src/data/preloadedGames.json`, local-only)
  2. Local overrides and additions from `localStorage`
- Storage key: `manual-boardgame-ranking-v1`
- If you add a game without an image URL, a built-in fallback poster is used.
- If no preloaded file exists, startup uses only `localStorage` (or empty state for first-time users).

## PNG Export

On the results screen you can:

- Set a custom result name
- Pick a custom background color
- Export the rendered result card as PNG

The exported image includes:

- Title (your result name)
- Top list with rank, image, and name
- Your chosen background styling

Note: external image hosts may block canvas capture (CORS), which can affect export in some cases.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- html-to-image (for PNG export)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build production bundle
- `npm run lint` - run ESLint
- `npm run preview` - preview production build locally

## Main Files

- `src/App.tsx` - UI flow and interactions
- `src/hooks/useTournament.ts` - ranking/tournament engine
- `src/data/preloadedGames.json` - optional local preloaded game list (ignored by git)
- `src/index.css` - global base styles and Tailwind layers

## Notes

- This project is intentionally API-free.
- You can add your own local preloaded JSON at `src/data/preloadedGames.json` at any time.
