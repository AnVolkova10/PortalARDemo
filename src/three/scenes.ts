import * as THREE from "three";

export type PortalScenes = {
  outsideScene: THREE.Scene;
  insideScene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  outsideLight: THREE.Light;
  insideLights: THREE.Light[];
};

export function createPortalScenes(): PortalScenes {
  const outsideScene = new THREE.Scene();
  outsideScene.background = null;

  const insideScene = new THREE.Scene();
  insideScene.background = new THREE.Color("#05060d");

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(0, 1.6, 0);

  const outsideLight = new THREE.HemisphereLight("#81d4fa", "#11131f", 0.6);
  outsideScene.add(outsideLight);

  const ambient = new THREE.AmbientLight("#8893ff", 0.6);
  const directional = new THREE.DirectionalLight("#2bf0ff", 0.8);
  directional.position.set(2, 3, 1);
  directional.castShadow = false;
  insideScene.add(ambient, directional);

  return {
    outsideScene,
    insideScene,
    camera,
    outsideLight,
    insideLights: [ambient, directional]
  };
}
