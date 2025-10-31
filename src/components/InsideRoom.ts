import * as THREE from "three";

export type InsideRoomInstance = {
  group: THREE.Group;
  dispose: () => void;
};

function createInfoPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.fillStyle = "#060b14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#2bf0ff");
  gradient.addColorStop(1, "#826bff");
  ctx.fillStyle = gradient;
  ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = "#05060d";
  ctx.font = "bold 80px 'Space Grotesk'";
  ctx.fillText("TECweek Portal", 80, 200);
  ctx.font = "36px 'Inter'";
  ctx.fillText("Future Cities Showcase", 80, 280);
  ctx.font = "30px 'Inter'";
  ctx.fillText("Discover immersive activations & talks", 80, 360);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createInsideRoom(): InsideRoomInstance {
  const group = new THREE.Group();
  group.position.set(0, 1.5, -3);

  const roomSize = new THREE.Vector3(6, 4, 8);
  const roomGeometry = new THREE.BoxGeometry(roomSize.x, roomSize.y, roomSize.z);
  roomGeometry.scale(1, 1, 1);
  const roomMaterial = new THREE.MeshStandardMaterial({
    color: "#0c0f18",
    side: THREE.BackSide,
    roughness: 0.4,
    metalness: 0.05
  });
  const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
  roomMesh.position.set(0, 0, 0);

  const stripGeometry = new THREE.PlaneGeometry(roomSize.x, 0.1);
  const stripMaterial = new THREE.MeshBasicMaterial({
    color: "#2bf0ff",
    transparent: true,
    opacity: 0.45
  });

  const topStrip = new THREE.Mesh(stripGeometry, stripMaterial);
  topStrip.position.set(0, roomSize.y / 2 - 0.3, -roomSize.z / 4);
  const bottomStrip = topStrip.clone();
  bottomStrip.position.y = -roomSize.y / 2 + 0.3;

  const panelTexture = createInfoPanelTexture();
  const panelMaterial = new THREE.MeshBasicMaterial({
    map: panelTexture,
    transparent: true
  });
  const panelGeometry = new THREE.PlaneGeometry(2.8, 1.4);
  const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
  panelMesh.position.set(0, 0.8, -roomSize.z / 2 + 0.05);

  const floorGeometry = new THREE.CircleGeometry(1.5, 64);
  const floorMaterial = new THREE.MeshBasicMaterial({
    color: "#141f34",
    transparent: true,
    opacity: 0.9
  });
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, -roomSize.y / 2 + 0.02, -2);

  group.add(roomMesh, topStrip, bottomStrip, panelMesh, floorMesh);

  return {
    group,
    dispose() {
      roomGeometry.dispose();
      roomMaterial.dispose();
      stripGeometry.dispose();
      stripMaterial.dispose();
      panelGeometry.dispose();
      panelMaterial.dispose();
      panelTexture.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
    }
  };
}
