import * as THREE from "three";

export type PortalRingInstance = {
  group: THREE.Group;
  mask: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  dispose: () => void;
};

type PortalRingOptions = {
  radius?: number;
  thickness?: number;
  color?: string;
};

export function createPortalRing(options: PortalRingOptions = {}): PortalRingInstance {
  const { radius = 0.9, thickness = 0.12, color = "#2bf0ff" } = options;

  const ringGeometry = new THREE.RingGeometry(radius - thickness, radius, 64);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.1,
    roughness: 0.3,
    side: THREE.DoubleSide
  });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.castShadow = false;
  ringMesh.receiveShadow = false;
  ringMesh.renderOrder = 2;

  const innerMaskGeometry = new THREE.CircleGeometry(radius - thickness * 0.5, 64);
  const innerMaskMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const maskMesh = new THREE.Mesh(innerMaskGeometry, innerMaskMaterial);
  maskMesh.position.z = -0.01;

  const glowGeometry = new THREE.RingGeometry(radius, radius + thickness * 0.75, 64);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.renderOrder = 1;

  const group = new THREE.Group();
  group.add(maskMesh, ringMesh, glowMesh);

  return {
    group,
    mask: maskMesh,
    dispose() {
      ringGeometry.dispose();
      ringMaterial.dispose();
      innerMaskGeometry.dispose();
      innerMaskMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    }
  };
}
