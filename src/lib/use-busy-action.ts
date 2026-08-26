import { useCallback, useState } from "react";

/** Run an async action while exposing a busy flag for buttons. */
export function useBusyAction() {
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, run };
}
