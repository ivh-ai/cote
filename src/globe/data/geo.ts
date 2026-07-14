/**
 * Geo data pipeline — see 06_GLOBE_RENDERING_SPEC.md §9.
 * Loads Natural Earth 110m TopoJSON, converts each country's lon/lat polygons into
 * geometry projected onto a unit sphere, and computes centroids for rotate-to.
 *
 * Fills are triangulated in lon/lat space (THREE.ShapeUtils, handles holes) and then
 * midpoint-tessellated so triangles stay close to the sphere surface (no chording gaps).
 */
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson'

const DEG2RAD = Math.PI / 180
/** Max angular edge length (radians) before a triangle edge is subdivided. */
const MAX_EDGE = 0.05 // ~2.9°, keeps large countries hugging the surface

export interface CountryGeo {
  id: string
  name: string
  /** Filled surface mesh geometry (on the sphere, radius `radius`). */
  fill: THREE.BufferGeometry
  /** Border outline positions (line segments). */
  outline: THREE.BufferGeometry
  /** Centroid direction (unit vector) for rotate-to. */
  centroid: THREE.Vector3
}

/** lon/lat (degrees) → point on a sphere of the given radius. */
export function lonLatToVec3(lon: number, lat: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Recursively push a triangle's midpoints until each edge is short, projecting to the sphere. */
function tessellateTriangle(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  radius: number,
  out: number[],
  depth = 0,
): void {
  const ab = Math.hypot((a[0] - b[0]) * DEG2RAD, (a[1] - b[1]) * DEG2RAD)
  const bc = Math.hypot((b[0] - c[0]) * DEG2RAD, (b[1] - c[1]) * DEG2RAD)
  const ca = Math.hypot((c[0] - a[0]) * DEG2RAD, (c[1] - a[1]) * DEG2RAD)
  const longest = Math.max(ab, bc, ca)
  if (longest > MAX_EDGE && depth < 5) {
    const mAB: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const mBC: [number, number] = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]
    const mCA: [number, number] = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]
    tessellateTriangle(a, mAB, mCA, radius, out, depth + 1)
    tessellateTriangle(mAB, b, mBC, radius, out, depth + 1)
    tessellateTriangle(mCA, mBC, c, radius, out, depth + 1)
    tessellateTriangle(mAB, mBC, mCA, radius, out, depth + 1)
    return
  }
  for (const [lon, lat] of [a, b, c]) {
    const v = lonLatToVec3(lon, lat, radius)
    out.push(v.x, v.y, v.z)
  }
}

/** Build a filled geometry for one polygon (outer ring + holes) in lon/lat. */
function buildPolygonFill(rings: number[][][], radius: number, positions: number[]): void {
  const outer = rings[0]
  if (!outer || outer.length < 3) return
  const contour = outer.map((p) => new THREE.Vector2(p[0], p[1]))
  const holes = rings.slice(1).map((r) => r.map((p) => new THREE.Vector2(p[0], p[1])))
  // Combined vertex list: contour first, then each hole (matches triangulateShape output indices)
  const combined = [...contour]
  for (const h of holes) combined.push(...h)
  let faces: number[][]
  try {
    faces = THREE.ShapeUtils.triangulateShape(contour, holes)
  } catch {
    return
  }
  for (const [i0, i1, i2] of faces) {
    const p0 = combined[i0], p1 = combined[i1], p2 = combined[i2]
    if (!p0 || !p1 || !p2) continue
    tessellateTriangle([p0.x, p0.y], [p1.x, p1.y], [p2.x, p2.y], radius, positions)
  }
}

/** Build border outline line-segments for one ring. */
function buildRingOutline(ring: number[][], radius: number, positions: number[]): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const va = lonLatToVec3(a[0], a[1], radius)
    const vb = lonLatToVec3(b[0], b[1], radius)
    positions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z)
  }
}

/**
 * Unwrap a ring's longitudes so polygons that cross the ±180° antimeridian stay
 * contiguous in lon/lat space (prevents seam-spanning triangulation slivers).
 * Projection uses periodic trig, so unwrapped longitudes still map correctly.
 */
function unwrapRing(ring: number[][]): number[][] {
  if (ring.length === 0) return ring
  const out: number[][] = [ring[0].slice()]
  let prevLon = ring[0][0]
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0]
    while (lon - prevLon > 180) lon -= 360
    while (lon - prevLon < -180) lon += 360
    out.push([lon, ring[i][1]])
    prevLon = lon
  }
  return out
}

function polygonsOf(geom: Geometry): number[][][][] {
  if (geom.type === 'Polygon') return [(geom as Polygon).coordinates]
  if (geom.type === 'MultiPolygon') return (geom as MultiPolygon).coordinates
  return []
}

/**
 * Load and process the country geometries.
 * @param url path to the TopoJSON file (self-hosted under /data)
 * @param radius sphere radius for fills; outline sits slightly above
 */
export async function loadCountryGeometries(
  url: string,
  radius = 1,
): Promise<CountryGeo[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load geo data: ${res.status}`)
  const topo = await res.json()
  // topojson-client `feature` returns a FeatureCollection for a GeometryCollection object.
  const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection
  const outlineRadius = radius * 1.001

  const result: CountryGeo[] = []
  for (const f of fc.features as Feature[]) {
    const id = String(f.id ?? '')
    if (!id) continue
    const name = (f.properties?.name as string) ?? id
    const polys = polygonsOf(f.geometry)
    if (polys.length === 0) continue

    const fillPos: number[] = []
    const outlinePos: number[] = []
    // Centroid from the LARGEST polygon by area (shoelace), so multi-territory
    // countries (France+Guiana, USA+Alaska+Hawaii) rotate to their main landmass.
    let bestCentroid = new THREE.Vector3(0, 0, 1)
    let bestArea = -1

    for (const rawRings of polys) {
      const rings = rawRings.map(unwrapRing)
      buildPolygonFill(rings, radius, fillPos)
      const outer = rings[0]
      if (outer && outer.length >= 3) {
        let area = 0
        for (let i = 0; i < outer.length; i++) {
          const [x1, y1] = outer[i]
          const [x2, y2] = outer[(i + 1) % outer.length]
          area += x1 * y2 - x2 * y1
        }
        area = Math.abs(area) / 2
        if (area > bestArea) {
          bestArea = area
          const acc = new THREE.Vector3()
          for (const [lon, lat] of outer) acc.add(lonLatToVec3(lon, lat, radius))
          bestCentroid = acc.divideScalar(outer.length).normalize()
        }
      }
      for (const ring of rings) {
        buildRingOutline(ring, outlineRadius, outlinePos)
      }
    }
    if (fillPos.length === 0) continue

    const fill = new THREE.BufferGeometry()
    fill.setAttribute('position', new THREE.Float32BufferAttribute(fillPos, 3))
    fill.computeVertexNormals()

    const outline = new THREE.BufferGeometry()
    outline.setAttribute('position', new THREE.Float32BufferAttribute(outlinePos, 3))

    result.push({ id, name, fill, outline, centroid: bestCentroid })
  }
  return result
}
