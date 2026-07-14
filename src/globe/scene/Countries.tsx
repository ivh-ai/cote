/**
 * Country layer — per-country meshes on the sphere with batched fill/found/missed state
 * and reveal tweens. See 06_GLOBE_RENDERING_SPEC.md §9–§13.
 *
 * Exposes an imperative API (via apiRef) so game state flows in through a ref bridge —
 * React never re-renders this layer on a guess (Blueprint §6.1).
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CountryGeo } from '../data/geo'
import {
  biomeColor,
  LAND_UNFOUND,
  LAND_MISSED,
  STROKE_DEFAULT,
  STROKE_MISSED,
} from '../data/topoColors'

export type GameStatus = 'idle' | 'playing' | 'finished'

export interface CountryLayerApi {
  /** Batched update of found set + game status (Blueprint §6.3). */
  setStates(foundIds: Set<string>, status: GameStatus): void
  /** Unit centroid direction for rotate-to, or null if unknown. */
  getCentroid(id: string): THREE.Vector3 | null
}

interface Entry {
  id: string
  mesh: THREE.Mesh
  material: THREE.MeshStandardMaterial
  outline: THREE.LineSegments
  outlineMat: THREE.LineBasicMaterial
  target: THREE.Color
  targetEmissive: number
  pulse: number
  centroid: THREE.Vector3
  found: boolean
}

export function Countries({
  geos,
  apiRef,
}: {
  geos: CountryGeo[]
  apiRef: (api: CountryLayerApi | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const entriesRef = useRef<Map<string, Entry>>(new Map())

  const entries = useMemo<Entry[]>(() => {
    return geos.map((g) => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(LAND_UNFOUND),
        roughness: 0.85,
        metalness: 0.0,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      })
      const mesh = new THREE.Mesh(g.fill, material)
      const outlineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(STROKE_DEFAULT),
        transparent: true,
        opacity: 0.6,
      })
      const outline = new THREE.LineSegments(g.outline, outlineMat)
      return {
        id: g.id,
        mesh,
        material,
        outline,
        outlineMat,
        target: new THREE.Color(LAND_UNFOUND),
        targetEmissive: 0,
        pulse: 0,
        centroid: g.centroid,
        found: false,
      }
    })
  }, [geos])

  // Register the imperative API and index entries.
  useEffect(() => {
    const map = new Map<string, Entry>()
    for (const e of entries) map.set(e.id, e)
    entriesRef.current = map

    const api: CountryLayerApi = {
      setStates(foundIds, status) {
        for (const e of entriesRef.current.values()) {
          const isFound = foundIds.has(e.id)
          const justFound = isFound && !e.found
          e.found = isFound
          if (isFound) {
            e.target.set(biomeColor(e.id))
            e.outlineMat.color.set(STROKE_DEFAULT)
            if (justFound) e.pulse = 1 // trigger reveal flash
          } else if (status === 'finished') {
            e.target.set(LAND_MISSED)
            e.outlineMat.color.set(STROKE_MISSED)
          } else {
            e.target.set(LAND_UNFOUND)
            e.outlineMat.color.set(STROKE_DEFAULT)
          }
        }
      },
      getCentroid(id) {
        return entriesRef.current.get(id)?.centroid.clone() ?? null
      },
    }
    apiRef(api)
    return () => apiRef(null)
  }, [entries, apiRef])

  // Dispose geometries/materials on unmount (Blueprint §11.3).
  useEffect(() => {
    return () => {
      for (const e of entries) {
        e.material.dispose()
        e.outlineMat.dispose()
        e.mesh.geometry.dispose()
        e.outline.geometry.dispose()
      }
    }
  }, [entries])

  // Per-frame colour tweens + reveal pulse decay (loop decoupled from React).
  useFrame(() => {
    for (const e of entries) {
      e.material.color.lerp(e.target, 0.14)
      if (e.pulse > 0.001) {
        e.pulse *= 0.9
        e.material.emissive.set(biomeColor(e.id))
        e.material.emissiveIntensity = e.pulse * 0.8
      } else if (e.material.emissiveIntensity !== 0) {
        e.material.emissiveIntensity = 0
      }
    }
  })

  return (
    <group ref={groupRef}>
      {entries.map((e) => (
        <primitive key={e.id} object={e.mesh} />
      ))}
      {entries.map((e) => (
        <primitive key={`o-${e.id}`} object={e.outline} />
      ))}
    </group>
  )
}
