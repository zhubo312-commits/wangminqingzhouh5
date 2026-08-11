import { useCallback, useEffect, useRef, useState } from "react";

export function usePaipanSessionRestore<Context>({
  storageKey,
  fetchContext,
  onRestore,
}: {
  storageKey: string;
  fetchContext: (reference: string, signal: AbortSignal) => Promise<Context>;
  onRestore: (context: Context) => void;
}) {
  const fetchContextRef = useRef(fetchContext);
  const onRestoreRef = useRef(onRestore);
  const [isRestoring, setIsRestoring] = useState(true);

  fetchContextRef.current = fetchContext;
  onRestoreRef.current = onRestore;

  useEffect(() => {
    const storedReference = window.sessionStorage.getItem(storageKey);
    if (!storedReference) {
      setIsRestoring(false);
      return;
    }

    const controller = new AbortController();
    void fetchContextRef.current(storedReference, controller.signal)
      .then((context) => onRestoreRef.current(context))
      .catch(() => window.sessionStorage.removeItem(storageKey))
      .finally(() => setIsRestoring(false));
    return () => controller.abort();
  }, [storageKey]);

  const rememberReference = useCallback((reference: string) => {
    window.sessionStorage.setItem(storageKey, reference);
  }, [storageKey]);

  return { isRestoring, rememberReference };
}
