/**
 * Globe interaction: auto-spin, drag-rotate, double-click zoom, rotate-to, keyboard.
 * See 06_GLOBE_RENDERING_SPEC.md §14–§16. Loop runs in useFrame, decoupled from React.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ControlsApi {
  rotateTo(centroid: THREE.Vector3): void
  toggleZoom(): void
  reset(): void
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)
const FRONT = new THREE.Vector3(0, 0, 1)
const AUTO_SPIN = 0.0009
const MIN_Z = 1.6
const MAX_Z = 3.2
const ZOOM_IN_Z = 1.9

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
  const targetQuat = useRef<THREE.Quaternion | null>(null)
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
      targetQuat.current = null
      el.style.cursor = 'grabbing'
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.current || !groupRef.current) return
      const dx = e.clientX - drag.current.x
      drag.current = { x: e.clientX, y: e.clientY }
      const k = zoomed.current ? 0.0035 : 0.006
      // Spin on the vertical axis only — no pitch/tumble (globe stays upright).
      groupRef.current.rotateOnWorldAxis(Y_AXIS, dx * k)
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
      if (!groupRef.current) return
      autoSpin.current = false
      targetQuat.current = new THREE.Quaternion().setFromUnitVectors(
        centroid.clone().normalize(),
        FRONT,
      )
    },
    toggleZoom() {
      zoomed.current = !zoomed.current
      targetZ.current = zoomed.current ? ZOOM_IN_Z : MAX_Z
      if (!zoomed.current && !reducedMotion) autoSpin.current = true
    },
    reset() {
      zoomed.current = false
      targetZ.current = MAX_Z
      targetQuat.current = null
      autoSpin.current = !reducedMotion
    },
  }

  useEffect(() => {
    onReady(api)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    if (targetQuat.current) {
      g.quaternion.slerp(targetQuat.current, 0.09)
      if (g.quaternion.angleTo(targetQuat.current) < 0.01) targetQuat.current = null
    } else if (autoSpin.current && !drag.current) {
      g.rotateOnWorldAxis(Y_AXIS, AUTO_SPIN)
    }
    // Smooth zoom
    camera.position.z += (targetZ.current - camera.position.z) * 0.08
  })

  return null
}
