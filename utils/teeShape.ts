import * as THREE from 'three'

// Tee outline for Three.js. Units: about 1.36 wide and 1.15 tall, neck at y = 1.15, hem at y = 0.
// Keep in step with TEE_SVG_PATH in utils/teeSvg.ts.
export function buildTeeShape(): THREE.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(-0.12, 1.15)
  shape.quadraticCurveTo(0, 1.03, 0.12, 1.15)
  shape.lineTo(0.34, 1.08)
  shape.lineTo(0.68, 0.86)
  shape.lineTo(0.58, 0.62)
  shape.lineTo(0.38, 0.74)
  shape.lineTo(0.36, 0)
  shape.lineTo(-0.36, 0)
  shape.lineTo(-0.38, 0.74)
  shape.lineTo(-0.58, 0.62)
  shape.lineTo(-0.68, 0.86)
  shape.lineTo(-0.34, 1.08)
  shape.closePath()
  return shape
}
