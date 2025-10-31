import { useCallback, useState } from "react";

export type PortalState = "outside" | "entering" | "inside";

type Actions = {
  beginEntering: () => void;
  completeEnter: () => void;
  exitPortal: () => void;
  reset: () => void;
};

export function usePortalState(initial: PortalState = "outside"): [PortalState, Actions] {
  const [state, setState] = useState<PortalState>(initial);

  const beginEntering = useCallback(() => {
    setState((current) => (current === "outside" ? "entering" : current));
  }, []);

  const completeEnter = useCallback(() => {
    setState("inside");
  }, []);

  const exitPortal = useCallback(() => {
    setState("outside");
  }, []);

  const reset = useCallback(() => {
    setState(initial);
  }, [initial]);

  return [
    state,
    {
      beginEntering,
      completeEnter,
      exitPortal,
      reset
    }
  ];
}
