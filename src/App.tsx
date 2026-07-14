/** COTE — app composition. Persistent globe + surfaces + modal host. See 02, 07 §3. */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { GlobeApi } from './globe/GlobeCanvas'
import { useGameState } from './game/useGameState'

// Lazy-load the globe so Three.js is fetched/parsed after first paint (perf: keeps
// the UI interactive while the ~235 KB gz three chunk streams in). See 09_QA_REPORT.md §5.
const GlobeCanvas = lazy(() =>
  import('./globe/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })),
)
import { hasOnboarded, loadLastName, setOnboarded } from './services/storage'
import { TopBar, type OverlayName } from './ui/components/TopBar'
import { InputBar } from './ui/components/InputBar'
import { ContinentPanel } from './ui/components/ContinentPanel'
import { TransientLayer } from './ui/components/TransientLayer'
import { ConfirmDialog } from './ui/components/ConfirmDialog'
import { WelcomeScreen } from './ui/screens/WelcomeScreen'
import { ResultsScreen } from './ui/screens/ResultsScreen'
import { LeaderboardModal } from './ui/overlays/LeaderboardModal'
import { InstructionsModal } from './ui/overlays/InstructionsModal'
import { AboutModal } from './ui/overlays/AboutModal'
import { StatsModal } from './ui/overlays/StatsModal'
import { AchievementsModal } from './ui/overlays/AchievementsModal'

type Overlay = OverlayName | 'about' | null

export default function App() {
  const globeRef = useRef<GlobeApi>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const game = useGameState(globeRef)

  const [showWelcome, setShowWelcome] = useState(true)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [confirm, setConfirm] = useState<{ message: string; label: string; action: () => void } | null>(null)

  const finished = game.status === 'finished'
  const blocked = showWelcome || overlay !== null || confirm !== null || finished

  // Keep the guess input focused whenever the game surface is interactive.
  useEffect(() => {
    if (!blocked) inputRef.current?.focus()
  }, [blocked])

  const start = useCallback(() => {
    setShowWelcome(false)
    if (!hasOnboarded()) {
      setOverlay('instructions')
      setOnboarded()
    }
  }, [])

  const newGame = useCallback(() => {
    const act = () => {
      game.reset()
      setShowWelcome(true)
    }
    if (game.status === 'playing' && game.count > 0) {
      setConfirm({ message: `End current game? You’ve found ${game.count} countries.`, label: 'End game', action: () => { act(); setConfirm(null) } })
    } else {
      act()
    }
  }, [game])

  const giveUp = useCallback(() => {
    setConfirm({
      message: `Give up? You’ve found ${game.count} countries. We’ll reveal the rest.`,
      label: 'Give up',
      action: () => { game.giveUp(); setConfirm(null) },
    })
  }, [game])

  const playAgain = useCallback(() => {
    game.reset()
    setShowWelcome(false)
  }, [game])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--canvas)' }}>
      {/* Persistent globe — never unmounts on navigation; lazy-loaded after first paint */}
      <Suspense fallback={null}>
        <GlobeCanvas ref={globeRef} />
      </Suspense>

      {/* Game HUD */}
      <main aria-hidden={blocked}>
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 'min(1040px, 96vw)' }}>
          <TopBar
            timerIdx={game.timerIdx}
            onSetTimerIdx={game.setTimerIdx}
            status={game.status}
            displaySeconds={game.displaySeconds}
            isCountdown={game.isCountdown}
            count={game.count}
            onGiveUp={giveUp}
            onNewGame={newGame}
            onOpen={(n) => setOverlay(n)}
          />
        </div>

        <TransientLayer badge={game.badge} achievements={game.newAchievements} />

        <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <InputBar
            ref={inputRef}
            value={game.input}
            onChange={game.handleChange}
            onEnter={game.handleEnter}
            suggestion={game.suggestion}
            onAcceptSuggestion={game.acceptSuggestion}
            feedback={game.feedback}
            disabled={finished}
            finished={finished}
          />
        </div>

        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <ContinentPanel foundIds={game.foundIds} finished={finished} />
        </div>
      </main>

      {/* Surfaces */}
      {showWelcome && (
        <WelcomeScreen
          timerIdx={game.timerIdx}
          onSetTimerIdx={game.setTimerIdx}
          onStart={start}
          onOpenInstructions={() => setOverlay('instructions')}
          onOpenLeaderboard={() => setOverlay('leaderboard')}
          onOpenAbout={() => setOverlay('about')}
        />
      )}

      {finished && (
        <ResultsScreen
          perfect={game.perfect}
          count={game.count}
          seconds={game.seconds}
          timerIdx={game.timerIdx}
          foundIds={game.foundIds}
          initialName={loadLastName()}
          onPlayAgain={playAgain}
          onOpenLeaderboard={() => setOverlay('leaderboard')}
        />
      )}

      {/* Modal host — one at a time */}
      {overlay === 'instructions' && <InstructionsModal onClose={() => setOverlay(null)} />}
      {overlay === 'leaderboard' && <LeaderboardModal onClose={() => setOverlay(null)} />}
      {overlay === 'stats' && <StatsModal onClose={() => setOverlay(null)} />}
      {overlay === 'achievements' && <AchievementsModal onClose={() => setOverlay(null)} />}
      {overlay === 'about' && <AboutModal onClose={() => setOverlay(null)} />}

      {confirm && (
        <ConfirmDialog message={confirm.message} confirmLabel={confirm.label} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
