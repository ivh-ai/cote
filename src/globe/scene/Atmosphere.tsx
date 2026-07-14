/** Fresnel atmosphere shell — see 06_GLOBE_RENDERING_SPEC.md §7. */
import { useMemo } from 'react'
import * as THREE from 'three'

export function Atmosphere({ radius = 1.02 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color('#7fb2c4') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColor;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vView)), 4.5);
            gl_FragColor = vec4(uColor, rim * 0.85);
          }
        `,
      }),
    [],
  )

  return (
    <mesh material={material} scale={radius}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  )
}
