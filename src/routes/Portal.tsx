import { useEffect, useMemo, useState } from "react";
import CameraBackground from "../components/CameraBackground";
import CameraPermission from "../components/CameraPermission";
import OverlayUI from "../components/OverlayUI";
import PortalCanvas from "../components/PortalCanvas";
import { useCameraFeed } from "../hooks/useCameraFeed";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { usePortalState } from "../hooks/usePortalState";
import { useXRDetection } from "../hooks/useXRDetection";

function PortalRoute() {
  const { status: cameraStatus, error: cameraError, request: requestCamera, video } = useCameraFeed();
  const xr = useXRDetection();
  const deviceOrientation = useDeviceOrientation();
  const [portalState, portalActions] = usePortalState();
  const [placementHint, setPlacementHint] = useState<string | undefined>();

  const mode = xr.supported ? "xr" : "camera";
  const showCameraPermission = mode === "camera" && cameraStatus !== "ready";

  useEffect(() => {
    if (mode === "camera" && cameraStatus === "idle") {
      void requestCamera();
      setPlacementHint("Tap to place the portal around 2m ahead.");
    }
  }, [mode, cameraStatus, requestCamera]);

  useEffect(() => {
    if (mode === "xr") {
      setPlacementHint("Move your device to find a surface and anchor the portal.");
    }
  }, [mode]);

  useEffect(() => {
    if (portalState === "inside") {
      setPlacementHint(undefined);
    }
  }, [portalState]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && portalState === "inside") {
        portalActions.exitPortal();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [portalActions, portalState]);

  const showEnterPrompt = useMemo(() => portalState === "outside", [portalState]);

  return (
    <main className="portal-experience">
      {mode === "camera" && (
        <CameraBackground video={video} active={cameraStatus === "ready"} />
      )}

      <PortalCanvas
        mode={mode}
        portalState={portalState}
        orientation={deviceOrientation.orientation}
        onProximityEnter={() => portalActions.beginEntering()}
        onEnterTransitionComplete={() => portalActions.completeEnter()}
        onPortalPlaced={() =>
          setPlacementHint("Portal anchored. Approach or tap Enter to step in.")
        }
      />

      <OverlayUI
        portalState={portalState}
        xrSupported={xr.supported}
        onEnter={() => portalActions.beginEntering()}
        onExit={() => portalActions.exitPortal()}
        requestOrientationAccess={deviceOrientation.requestPermission}
        orientationPermission={deviceOrientation.permission}
        showEnterPrompt={showEnterPrompt}
        placementHint={placementHint}
      />

      {showCameraPermission && (
        <div className="portal-overlay portal-overlay--blocking">
          <CameraPermission
            status={cameraStatus}
            error={cameraError}
            onRequest={requestCamera}
          />
        </div>
      )}

      {!xr.supported && !xr.checking && mode !== "xr" && (
        <div className="portal-overlay portal-overlay--info">
          <p>WebXR AR is unavailable. Falling back to camera mode.</p>
        </div>
      )}
    </main>
  );
}

export default PortalRoute;
