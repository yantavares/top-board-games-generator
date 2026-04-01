import type { SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BattlePhase } from './components/phases/BattlePhase';
import { ResultsPhase } from './components/phases/ResultsPhase';
import { SetupPhase } from './components/phases/SetupPhase';
import { createFallbackPoster } from './lib/fallbackPoster';
import { ambientDots } from './lib/uiConstants';
import { useGameCollection } from './hooks/useGameCollection';
import { useTournamentFlow } from './hooks/useTournamentFlow';

function App() {
  const {
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
  } = useGameCollection();

  const {
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
  } = useTournamentFlow(games);

  const onImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const image = event.currentTarget;
    image.onerror = null;
    image.src = createFallbackPoster(image.alt);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8">
      {ambientDots.map((dot) => (
        <motion.span
          key={dot.id}
          aria-hidden="true"
          className={`pointer-events-none absolute -left-12 ${dot.topClass} ${dot.sizeClass} ${dot.colorClass} rounded-full blur-[1px]`}
          initial={{ x: '-8vw' }}
          animate={{ x: ['-8vw', '110vw'] }}
          transition={{
            duration: dot.duration,
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'loop',
            delay: dot.delay,
          }}
        />
      ))}

      <main className="relative z-10 mx-auto w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <SetupPhase
              games={games}
              name={name}
              imageUrl={imageUrl}
              formError={formError}
              jsonText={jsonText}
              jsonError={jsonError}
              jsonNotice={jsonNotice}
              isJsonPanelOpen={isJsonPanelOpen}
              savedAt={savedAt}
              targetTopXInput={targetTopXInput}
              estimatedComparisons={estimatedComparisons}
              setupError={setupError}
              onNameChange={setName}
              onImageUrlChange={setImageUrl}
              onSubmitGame={submitGame}
              onToggleJsonPanel={() => setIsJsonPanelOpen((previous) => !previous)}
              onJsonTextChange={setJsonText}
              onImportGamesFromJson={importGamesFromJson}
              onJsonFileSelected={onJsonFileSelected}
              onSavePreloadJson={savePreloadJson}
              onResetToPreload={resetToPreload}
              onClearCollection={clearCollection}
              onTargetTopXInputChange={(value) => setTargetTopXInput(value.replace(/\D/g, ''))}
              onCommitTopXInput={commitTopXInput}
              onStartBattle={startBattle}
              onRemoveGame={removeGame}
              onImageError={onImageError}
            />
          )}

          {phase === 'battle' && (
            <BattlePhase
              tournamentState={tournamentState}
              progressPercent={progressPercent}
              historyCount={historyCount}
              isResolvingChoice={isResolvingChoice}
              currentMatchup={currentMatchup}
              matchupKey={matchupKey}
              battleExitDirection={battleExitDirection}
              onUndoLastChoice={undoLastChoice}
              onChooseWinner={chooseWinner}
              onImageError={onImageError}
            />
          )}

          {phase === 'results' && (
            <ResultsPhase
              topXGames={topXGames}
              tournamentState={tournamentState}
              resultName={resultName}
              resultBgColor={resultBgColor}
              resultBgInput={resultBgInput}
              exportError={exportError}
              isExporting={isExporting}
              historyCount={historyCount}
              isResolvingChoice={isResolvingChoice}
              resultsPreviewRef={resultsPreviewRef}
              onResultNameChange={setResultName}
              onResultBgColorChange={setResultBgColor}
              onResultBgInputChange={setResultBgInput}
              onCommitResultColorInput={commitResultColorInput}
              onExportResults={exportResults}
              onUndoLastChoice={undoLastChoice}
              onRestartSameCollection={restartSameCollection}
              onStartBattle={startBattle}
              onImageError={onImageError}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mx-auto mt-5 w-full max-w-6xl text-center text-xs text-slate-400">
        <p>
          Made with ❤️ by{' '}
          <a
            href="https://github.com/yantavares/top-board-games-generator"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-slate-300 underline decoration-slate-500/70 underline-offset-4 transition hover:text-slate-100"
          >
            yantavares on GitHub
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

export default App;
