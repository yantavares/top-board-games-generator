# Board Game Tier List

<p align="center">
  <a href="https://github.com/yantavares/top-board-games-generator/actions/workflows/deploy.yml">
    <img alt="Deploy Status" src="https://github.com/yantavares/top-board-games-generator/actions/workflows/deploy.yml/badge.svg" />
  </a>
</p>

Local-first ranking app for board games.

## Highlights

- 🎯 Build your own collection and rank a Top X with smart head-to-head matchups.
- 🧩 Add games manually or import them from JSON.
- 💾 Persist collection in local storage automatically.
- 🗂️ Export your current collection as a preload JSON file.
- 🖼️ Export final ranking cards as PNG.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## JSON Import In App

Use the Setup screen option Import from JSON.

1. Paste JSON in the text area or click Load file.
2. Click Import JSON.
3. Optionally click Save preload JSON to generate preloadedGames.json.

If your browser supports native file saving, save directly to:

- src/data/preloadedGames.json

If native saving is not available, the app downloads preloadedGames.json.
Move that file into src/data/preloadedGames.json.

## JSON Format

Expected format is an array of objects:

```json
[
  {
    "name": "Brass: Birmingham"
  },
  {
    "name": "Spirit Island",
    "image": "https://example.com/spirit-island.jpg"
  }
]
```

Rules:

- name is required.
- image is optional.
- imageUrl is also accepted as an alternative key.
- if no image is provided, the app uses a built-in fallback poster.

## Data Loading Order

At startup, the app loads in this order:

1. Optional local preload file at src/data/preloadedGames.json
2. Local storage overrides and additions

Local storage key:

- manual-boardgame-ranking-v1

## Deployment

- 🚀 GitHub Pages via [deploy workflow](.github/workflows/deploy.yml)

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- html-to-image
