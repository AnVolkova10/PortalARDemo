import { ReactNode } from "react";

type Props = {
  status: "idle" | "pending" | "ready" | "error";
  error?: string | null;
  onRequest: () => void;
  actions?: ReactNode;
};

const statusMessages: Record<Props["status"], string> = {
  idle: "Enable your camera to explore the TECweek portal.",
  pending: "Requesting camera access…",
  ready: "Camera ready.",
  error: "Camera access failed."
};

function CameraPermission({ status, error, onRequest, actions }: Props) {
  return (
    <div className="camera-permission">
      <h2>Share Your Camera</h2>
      <p>{statusMessages[status]}</p>
      {error && <p className="camera-permission__error">{error}</p>}
      <div className="camera-permission__actions">
        {status !== "pending" && status !== "ready" && (
          <button type="button" onClick={onRequest} className="cta">
            Grant Camera Access
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

export default CameraPermission;
