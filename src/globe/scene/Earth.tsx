/** Ocean base sphere — lit, matches the original deep-ocean look. See 06 §8. */
import { useMemo } from 'react'
import * as THREE from 'three'

export function Earth({ radius = 1 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#155f92'),
        roughness: 0.5,
        metalness: 0.12,
        // Slight emissive so the dark side reads as Earthshine rather than pure black.
        emissive: new THREE.Color('#08243f'),
        emissiveIntensity: 0.65,
      }),
    [],
  )

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 96, 96]} />
    </mesh>
  )
}
