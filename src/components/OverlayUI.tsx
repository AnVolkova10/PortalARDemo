import { PortalState } from "../hooks/usePortalState";

type Props = {
  portalState: PortalState;
  xrSupported: boolean;
  onEnter: () => void;
  onExit: () => void;
  requestOrientationAccess: () => void;
  orientationPermission: "unknown" | "granted" | "denied";
  showEnterPrompt: boolean;
  placementHint?: string;
};

function OverlayUI({
  portalState,
  xrSupported,
  onEnter,
  onExit,
  requestOrientationAccess,
  orientationPermission,
  showEnterPrompt,
  placementHint
}: Props) {
  return (
    <div className="overlay-ui" aria-live="polite">
      <div className="overlay-ui__top">
        <span className="badge">{xrSupported ? "AR Ready" : "Camera Fallback"}</span>
        {placementHint && <span className="hint">{placementHint}</span>}
      </div>

      <div className="overlay-ui__center">
        {portalState === "outside" && showEnterPrompt && (
          <button type="button" className="cta" onClick={onEnter}>
            Enter Portal
          </button>
        )}
        {portalState === "inside" && (
          <button type="button" className="cta" onClick={onExit}>
            Exit Portal
          </button>
        )}
      </div>

      <div className="overlay-ui__bottom">
        {orientationPermission !== "granted" && (
          <button type="button" onClick={requestOrientationAccess} className="ghost">
            Enable Device Orientation
          </button>
        )}
        <span className="status">
          {portalState === "outside" && "Align with the portal ring to step through."}
          {portalState === "entering" && "Transitioning into the TECweek portal…"}
          {portalState === "inside" && "Explore the TECweek room and exit anytime."}
        </span>
      </div>
    </div>
  );
}

export default OverlayUI;
