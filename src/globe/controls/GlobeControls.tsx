/**
 * Globe interaction: auto-spin, drag-rotate (longitude + latitude), double-click
 * zoom, rotate-to. See 06_GLOBE_RENDERING_SPEC.md §14–§16. Loop runs in useFrame,
 * decoupled from React.
 *
 * Orientation is tracked as two scalars — yaw (spin around the world up axis) and
 * pitch (tilt toward the poles) — and the group quaternion is rebuilt from them
 * each frame as Rx(pitch)·Ry(yaw). Because roll is never introduced, the globe
 * stays upright at any latitude: horizontal drag pans longitude, vertical drag
 * pans latitude, and the meridians stay vertical on screen.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ControlsApi {
  rotateTo(centroid: THREE.Vector3): void
  toggleZoom(): void
  reset(): void
}

const AUTO_SPIN = 0.0009
const MIN_Z = 1.6
const MAX_Z = 3.2
const ZOOM_IN_Z = 1.9
// Clamp latitude tilt just short of the poles so the view never flips over.
const PITCH_MAX = 1.45 // ~83°
const TWO_PI = Math.PI * 2

const clampPitch = (p: number) => THREE.MathUtils.clamp(p, -PITCH_MAX, PITCH_MAX)

export function GlobeControls({
  groupRef,
  onReady,
  reducedMotion,
}: {
  groupRef: React.RefObject<THREE.Group | null>
  onReady: (api: ControlsApi) => void
  reducedMotion: boolean
}) {
  const { camera, gl } = useThree()
  const drag = useRef<{ x: number; y: number } | null>(null)
  const autoSpin = useRef(!reducedMotion)
  // Orientation state, driven every frame into the group quaternion.
  const yaw = useRef(0)
  const pitch = useRef(0)
  const target = useRef<{ yaw: number; pitch: number } | null>(null)
  const targetZ = useRef(MAX_Z)
  const zoomed = useRef(false)

  useEffect(() => {
    camera.position.set(0, 0, MAX_Z)
    targetZ.current = MAX_Z
  }, [camera])

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      drag.current = { x: e.clientX, y: e.clientY }
      autoSpin.current = false
      target.current = null // grabbing overrides any in-flight rotate-to
      el.style.cursor = 'grabbing'
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current = { x: e.clientX, y: e.clientY }
      const k = zoomed.current ? 0.0035 : 0.006
      yaw.current += dx * k // horizontal drag → longitude
      pitch.current = clampPitch(pitch.current + dy * k) // vertical drag → latitude
    }
    const onUp = (e: PointerEvent) => {
      drag.current = null
      el.style.cursor = 'grab'
      try { el.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    }
    const onDbl = () => api.toggleZoom()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetZ.current = THREE.MathUtils.clamp(targetZ.current + e.deltaY * 0.002, MIN_Z, MAX_Z)
      zoomed.current = targetZ.current < (MIN_Z + MAX_Z) / 2
    }
    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('dblclick', onDbl)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('dblclick', onDbl)
      el.removeEventListener('wheel', onWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, groupRef])

  const api: ControlsApi = {
    rotateTo(centroid) {
      // Solve the yaw/pitch that bring the centroid to front-center (0,0,1) with
      // q = Rx(pitch)·Ry(yaw): yaw squares up longitude, pitch lifts latitude.
      const c = centroid.clone().normalize()
      const targetYaw = Math.atan2(-c.x, c.z)
      const targetPitch = clampPitch(Math.atan2(c.y, Math.hypot(c.x, c.z)))
      // Ease along the shortest path from the current (possibly large) yaw.
      const nearYaw = targetYaw + TWO_PI * Math.round((yaw.current - targetYaw) / TWO_PI)
      autoSpin.current = false
      target.current = { yaw: nearYaw, pitch: targetPitch }
    },
    toggleZoom() {
      zoomed.current = !zoomed.current
      targetZ.current = zoomed.current ? ZOOM_IN_Z : MAX_Z
      if (!zoomed.current && !reducedMotion) autoSpin.current = true
    },
    reset() {
      zoomed.current = false
      targetZ.current = MAX_Z
      // Level the globe back to the equator view; keep current longitude.
      target.current = { yaw: yaw.current, pitch: 0 }
      autoSpin.current = !reducedMotion
    },
  }

  useEffect(() => {
    onReady(api)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const euler = useRef(new THREE.Euler(0, 0, 0, 'XYZ'))

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    if (target.current) {
      yaw.current += (target.current.yaw - yaw.current) * 0.09
      pitch.current += (target.current.pitch - pitch.current) * 0.09
      if (
        Math.abs(target.current.yaw - yaw.current) < 0.002 &&
        Math.abs(target.current.pitch - pitch.current) < 0.002
      ) {
        yaw.current = target.current.yaw
        pitch.current = target.current.pitch
        target.current = null
      }
    } else if (autoSpin.current && !drag.current) {
      yaw.current += AUTO_SPIN
    }
    euler.current.set(pitch.current, yaw.current, 0, 'XYZ')
    g.quaternion.setFromEuler(euler.current)
    // Smooth zoom
    camera.position.z += (targetZ.current - camera.position.z) * 0.08
  })

  return null
}
