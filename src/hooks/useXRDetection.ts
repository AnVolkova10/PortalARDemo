import { useEffect, useState } from "react";

type XRState = {
  supported: boolean;
  checking: boolean;
};

export function useXRDetection() {
  const [state, setState] = useState<XRState>({
    supported: false,
    checking: true
  });

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (!("xr" in navigator)) {
        setState({ supported: false, checking: false });
        return;
      }

      try {
        const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
        if (!cancelled) {
          setState({ supported: isSupported, checking: false });
        }
      } catch (error) {
        console.warn("WebXR detection failed", error);
        if (!cancelled) {
          setState({ supported: false, checking: false });
        }
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
