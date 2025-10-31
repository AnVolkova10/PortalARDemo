import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { createRenderer, handleResize } from "../three/renderer";
import { createPortalScenes, PortalScenes } from "../three/scenes";
import { createPortalRing, PortalRingInstance } from "./PortalRing";
import { createInsideRoom, InsideRoomInstance } from "./InsideRoom";
import { PortalEffect } from "../three/portalEffect";
import { PortalState } from "../hooks/usePortalState";
import { Orientation } from "../hooks/useDeviceOrientation";

type Props = {
  mode: "xr" | "camera";
  portalState: PortalState;
  orientation?: Orientation | null;
  onProximityEnter: () => void;
  onEnterTransitionComplete: () => void;
  onPortalPlaced?: () => void;
};

const ENTER_TRANSITION_MS = 900;
const DEFAULT_DISTANCE = 2.2;

function PortalCanvas({
  mode,
  portalState,
  orientation,
  onProximityEnter,
  onEnterTransitionComplete,
  onPortalPlaced
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const scenesRef = useRef<PortalScenes | null>(null);
  const portalRef = useRef<PortalRingInstance | null>(null);
  const roomRef = useRef<InsideRoomInstance | null>(null);
  const effectRef = useRef<PortalEffect | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const manualRotationRef = useRef({ yaw: 0, pitch: 0 });
  const pointerStateRef = useRef({ active: false, x: 0, y: 0 });
  const placementRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, -DEFAULT_DISTANCE));
  const portalStateRef = useRef<PortalState>(portalState);
  const orientationRef = useRef<Orientation | null>(orientation ?? null);
  const animationRef = useRef<number>();
  const xrSessionRef = useRef<XRSession | null>(null);
  const xrRefSpaceRef = useRef<XRReferenceSpace | null>(null);
  const xrHitTestRef = useRef<XRHitTestSource | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const hasTriggeredEnterRef = useRef(false);
  const portalPlacedRef = useRef(false);

  useEffect(() => {
    portalStateRef.current = portalState;
    if (portalState === "outside") {
      hasTriggeredEnterRef.current = false;
    }
  }, [portalState]);

  useEffect(() => {
    orientationRef.current = orientation ?? null;
  }, [orientation]);

  const updatePortalPlacement = useCallback((position: THREE.Vector3, normal?: THREE.Vector3) => {
    const portal = portalRef.current;
    if (!portal) {
      return;
    }
    const group = portal.group;
    group.position.copy(position);
    placementRef.current.copy(position);
    if (normal) {
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    } else {
      group.lookAt(new THREE.Vector3(position.x, position.y, position.z + 1));
    }
  }, []);

  useEffect(() => {
    if (portalState === "entering") {
      const timeout = setTimeout(() => onEnterTransitionComplete(), ENTER_TRANSITION_MS);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [portalState, onEnterTransitionComplete]);

  const startStandardRenderLoop = useCallback(() => {
    if (rendererRef.current?.xr.isPresenting) {
      return;
    }

    const render = () => {
      const renderer = rendererRef.current;
      const scenes = scenesRef.current;
      const effect = effectRef.current;
      const clock = clockRef.current;
      if (!renderer || !scenes || !effect || !clock) {
        return;
      }

      const delta = clock.getDelta();
      updateCamera(delta);
      evaluatePortalProximity();

      if (portalStateRef.current === "inside") {
        effect.renderInside();
      } else {
        effect.renderOutside();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
  }, []);

  const stopStandardRenderLoop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  const updateCamera = useCallback(
    (delta: number) => {
      const scenes = scenesRef.current;
      const portal = portalRef.current;
      if (!scenes || !portal) {
        return;
      }

      const camera = scenes.camera;
      const orientation = orientationRef.current;
      const manual = manualRotationRef.current;

      let yaw = manual.yaw;
      let pitch = manual.pitch;

      if (orientation) {
        yaw = THREE.MathUtils.degToRad(orientation.alpha ?? 0);
        pitch = THREE.MathUtils.degToRad((orientation.beta ?? 0) * 0.3);
      }

      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -yaw, 0.08);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, pitch, 0.08);
      camera.rotation.z = 0;

      const target = new THREE.Vector3().copy(portal.group.position);
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(portal.group.quaternion);

      if (portalStateRef.current === "inside") {
        target.addScaledVector(forward, -2.4);
        target.y = 1.65;
      } else {
        target.set(0, 1.6, 0.2);
      }

      camera.position.lerp(target, Math.min(delta * 2.4, 1));
      camera.updateMatrixWorld();
    },
    []
  );

  const evaluatePortalProximity = useCallback(() => {
    if (portalStateRef.current !== "outside" || hasTriggeredEnterRef.current) {
      return;
    }

    const scenes = scenesRef.current;
    const portal = portalRef.current;
    if (!scenes || !portal) {
      return;
    }

    const camera = scenes.camera;
    const group = portal.group;

    const center = group.position.clone().project(camera);
    const top = group.position.clone().add(new THREE.Vector3(0, group.scale.y, 0)).project(camera);
    const ndcHeight = Math.abs(top.y - center.y);

    if (ndcHeight > 0.45) {
      hasTriggeredEnterRef.current = true;
      onProximityEnter();
    }
  }, [onProximityEnter]);

  const placePortalFromPointer = useCallback(
    (event: PointerEvent) => {
      const scenes = scenesRef.current;
      const portal = portalRef.current;
      if (!scenes || !portal) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      const camera = scenes.camera;
      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        forward.clone().negate(),
        camera.position.clone().addScaledVector(forward, DEFAULT_DISTANCE)
      );
      const intersection = new THREE.Vector3();

      if (raycasterRef.current.ray.intersectPlane(plane, intersection)) {
        intersection.y = THREE.MathUtils.clamp(intersection.y, 1, 2);
        updatePortalPlacement(intersection, forward.clone());
      }
    },
    [updatePortalPlacement]
  );

  const startXRSession = useCallback(async () => {
    if (!("xr" in navigator) || rendererRef.current?.xr.isPresenting) {
      return;
    }

    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    const xr = navigator.xr;
    if (!xr) {
      return;
    }

    try {
      const session = await xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local-floor"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body }
      });

      xrSessionRef.current = session;
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local-floor");
      await renderer.xr.setSession(session);

      const refSpace = await session.requestReferenceSpace("local-floor");
      xrRefSpaceRef.current = refSpace;

      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      xrHitTestRef.current = hitTestSource;

      stopStandardRenderLoop();

      renderer.setAnimationLoop((_, frame) => {
        const effect = effectRef.current;
        const scenes = scenesRef.current;
        if (!frame || !effect || !scenes) {
          return;
        }

        const referenceSpace = xrRefSpaceRef.current;
        const hitSource = xrHitTestRef.current;
        if (referenceSpace && hitSource && !portalPlacedRef.current) {
          const hits = frame.getHitTestResults(hitSource);
          if (hits.length > 0) {
            const pose = hits[0].getPose(referenceSpace);
            if (pose) {
              const position = new THREE.Vector3(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              const normal = new THREE.Vector3(0, 0, -1).applyQuaternion(
                new THREE.Quaternion(
                  pose.transform.orientation.x,
                  pose.transform.orientation.y,
                  pose.transform.orientation.z,
                  pose.transform.orientation.w
                )
              );
              updatePortalPlacement(position, normal);
              portalPlacedRef.current = true;
              onPortalPlaced?.();
            }
          }
        }

        if (portalStateRef.current === "inside") {
          effect.renderInside();
        } else {
          effect.renderOutside();
        }
      });

      session.addEventListener("end", () => {
        xrSessionRef.current = null;
        xrRefSpaceRef.current = null;
        xrHitTestRef.current?.cancel();
        xrHitTestRef.current = null;
        portalPlacedRef.current = false;
        renderer.setAnimationLoop(null);
        startStandardRenderLoop();
      });
    } catch (error) {
      console.error("Unable to start WebXR session", error);
    }
  }, [startStandardRenderLoop, stopStandardRenderLoop, updatePortalPlacement, onPortalPlaced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = createRenderer(canvas);
    rendererRef.current = renderer;

    const scenes = createPortalScenes();
    scenes.camera.position.set(0, 1.6, 0.2);
    scenesRef.current = scenes;

    const portal = createPortalRing();
    portalRef.current = portal;
    scenes.outsideScene.add(portal.group);
    updatePortalPlacement(placementRef.current);

    const room = createInsideRoom();
    roomRef.current = room;
    scenes.insideScene.add(room.group);

    const effect = new PortalEffect({
      renderer,
      camera: scenes.camera,
      outsideScene: scenes.outsideScene,
      insideScene: scenes.insideScene,
      portalMask: portal.mask
    });
    effectRef.current = effect;

    clockRef.current = new THREE.Clock();

    function handleResizeEvent() {
      if (!rendererRef.current || !scenesRef.current) {
        return;
      }
      handleResize(rendererRef.current, scenesRef.current.camera);
    }

    window.addEventListener("resize", handleResizeEvent);

    startStandardRenderLoop();

    return () => {
      window.removeEventListener("resize", handleResizeEvent);
      stopStandardRenderLoop();
      renderer.dispose();
      effect.dispose();
      portal.dispose();
      room.dispose();
      rendererRef.current = null;
      effectRef.current = null;
      portalRef.current = null;
      roomRef.current = null;
      scenesRef.current = null;
    };
  }, [updatePortalPlacement, startStandardRenderLoop, stopStandardRenderLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      pointerStateRef.current = { active: true, x: event.clientX, y: event.clientY };

      if (mode === "camera" && !portalPlacedRef.current) {
        placePortalFromPointer(event);
        portalPlacedRef.current = true;
        onPortalPlaced?.();
      }

      if (mode === "xr") {
        void startXRSession();
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointerStateRef.current.active) {
        return;
      }
      if (mode === "camera") {
        const deltaX = event.clientX - pointerStateRef.current.x;
        const deltaY = event.clientY - pointerStateRef.current.y;
        pointerStateRef.current.x = event.clientX;
        pointerStateRef.current.y = event.clientY;

        manualRotationRef.current.yaw += deltaX * 0.003;
        manualRotationRef.current.pitch += deltaY * 0.002;
        manualRotationRef.current.pitch = THREE.MathUtils.clamp(manualRotationRef.current.pitch, -0.5, 0.5);
      }
    }

    function onPointerUp() {
      pointerStateRef.current.active = false;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [mode, onPortalPlaced, placePortalFromPointer, startXRSession]);

  return <canvas ref={canvasRef} className="portal-canvas" role="presentation" />;
}

export default PortalCanvas;
