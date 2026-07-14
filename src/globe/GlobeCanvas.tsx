/**
 * GlobeCanvas — the only React↔globe seam (Blueprint §6.1).
 * Owns the R3F canvas, loads geometry, and exposes an imperative API via ref so game
 * state flows in without re-rendering the scene on every guess.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Earth } from './scene/Earth'
import { Atmosphere } from './scene/Atmosphere'
import { Countries, type CountryLayerApi, type GameStatus } from './scene/Countries'
import { GlobeControls, type ControlsApi } from './controls/GlobeControls'
import { loadCountryGeometries, type CountryGeo } from './data/geo'

const DATA_URL = `${import.meta.env.BASE_URL}data/countries-110m.json`
const FILL_RADIUS = 1.002

export interface GlobeApi {
  /** Batched: reflect the found set + status on the globe (Blueprint §6.3). */
  updateCountries(foundIds: Set<string>, status: GameStatus): void
  /** Ease the globe so a country faces the camera. */
  rotateToCountry(id: string): void
  /** Toggle zoom / reset view. */
  toggleZoom(): void
  reset(): void
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

function Scene({
  geos,
  countriesApiRef,
  controlsApiRef,
  reducedMotion,
}: {
  geos: CountryGeo[]
  countriesApiRef: React.MutableRefObject<CountryLayerApi | null>
  controlsApiRef: React.MutableRefObject<ControlsApi | null>
  reducedMotion: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  return (
    <>
      <ambientLight intensity={0.55} color="#6b7684" />
      <directionalLight position={[-3, 2, 2.5]} intensity={2.7} color="#fff1d8" />
      <Stars radius={80} depth={40} count={reducedMotion ? 1200 : 3500} factor={3} fade speed={0} />
      <group ref={groupRef}>
        <Earth radius={1} />
        <Countries geos={geos} apiRef={(api) => (countriesApiRef.current = api)} />
      </group>
      <Atmosphere radius={1.015} />
      <GlobeControls
        groupRef={groupRef}
        reducedMotion={reducedMotion}
        onReady={(api) => (controlsApiRef.current = api)}
      />
    </>
  )
}

export interface GlobeCanvasProps {
  /** Reports the loaded country ids/names once geometry is ready. */
  onLoaded?: (countries: { id: string; name: string }[]) => void
}

export const GlobeCanvas = forwardRef<GlobeApi, GlobeCanvasProps>(function GlobeCanvas(
  { onLoaded },
  ref,
) {
  const reducedMotion = usePrefersReducedMotion()
  const [geos, setGeos] = useState<CountryGeo[] | null>(null)
  const [error, setError] = useState(false)
  const countriesApiRef = useRef<CountryLayerApi | null>(null)
  const controlsApiRef = useRef<ControlsApi | null>(null)
  const pending = useRef<{ found: Set<string>; status: GameStatus } | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCountryGeometries(DATA_URL, FILL_RADIUS)
      .then((g) => {
        if (cancelled) return
        setGeos(g)
        onLoaded?.(g.map((c) => ({ id: c.id, name: c.name })))
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
    // Load geometry exactly once on mount; onLoaded is a stable reporter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flush any state that arrived before the layer registered its API.
  useEffect(() => {
    if (geos && pending.current) {
      countriesApiRef.current?.setStates(pending.current.found, pending.current.status)
      pending.current = null
    }
  }, [geos])

  useImperativeHandle(
    ref,
    (): GlobeApi => ({
      updateCountries(foundIds, status) {
        if (countriesApiRef.current) countriesApiRef.current.setStates(foundIds, status)
        else pending.current = { found: new Set(foundIds), status }
      },
      rotateToCountry(id) {
        const c = countriesApiRef.current?.getCentroid(id)
        if (c) controlsApiRef.current?.rotateTo(c)
      },
      toggleZoom() {
        controlsApiRef.current?.toggleZoom()
      },
      reset() {
        controlsApiRef.current?.reset()
      },
    }),
    [],
  )

  if (error) {
    return (
      <div style={fallbackStyle} role="img" aria-label="World globe (failed to load)">
        Couldn’t load the map.
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }} aria-hidden={geos ? undefined : true}>
      <Canvas
        camera={{ fov: 40, position: [0, 0, 3.2], near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
        role="img"
        aria-label="Interactive globe showing country discovery progress"
      >
        <color attach="background" args={['#06080d']} />
        {geos && (
          <Scene
            geos={geos}
            countriesApiRef={countriesApiRef}
            controlsApiRef={controlsApiRef}
            reducedMotion={reducedMotion}
          />
        )}
      </Canvas>
      {!geos && (
        <div style={loadingStyle} aria-live="polite">
          Loading map…
        </div>
      )}
    </div>
  )
})

const fallbackStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'var(--stone-400)',
  background: 'var(--canvas)',
  fontSize: 14,
}

const loadingStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'var(--stone-400)',
  fontSize: 13,
  letterSpacing: '0.04em',
  pointerEvents: 'none',
}
