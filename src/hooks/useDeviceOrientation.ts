import { useCallback, useEffect, useRef, useState } from "react";

export type Orientation = {
  alpha: number;
  beta: number;
  gamma: number;
};

type PermissionState = "unknown" | "granted" | "denied";

export function useDeviceOrientation() {
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const listenerRef = useRef<(event: DeviceOrientationEvent) => void>();

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    setOrientation({
      alpha: event.alpha ?? 0,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0
    });
  }, []);

  const startListening = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("deviceorientation", listenerRef.current);
    }

    listenerRef.current = (event: DeviceOrientationEvent) => {
      handleOrientation(event);
    };

    window.addEventListener("deviceorientation", listenerRef.current);
  }, [handleOrientation]);

  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("deviceorientation", listenerRef.current);
      listenerRef.current = undefined;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent === "undefined") {
      setPermission("denied");
      return;
    }

    // iOS specific permission flow
    const needsExplicitPermission =
      typeof (DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<PermissionState> })
        .requestPermission === "function";

    try {
      if (needsExplicitPermission) {
        const response = await (DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<PermissionState>;
        }).requestPermission!();

        setPermission(response);
        if (response === "granted") {
          startListening();
        }
        return;
      }

      startListening();
      setPermission("granted");
    } catch (error) {
      console.warn("Device orientation permission failed", error);
      setPermission("denied");
    }
  }, [startListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    orientation,
    permission,
    requestPermission,
    stop: stopListening
  };
}
