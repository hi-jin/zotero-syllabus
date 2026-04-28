import { useCallback, useMemo } from "preact/hooks";
import { useSyncExternalStore } from "react-dom/src";
import { setPref, getPrefKey, getPrefValue } from "../../utils/prefs";

const PREF_KEY = getPrefKey("readerMode");

function toBooleanSnapshot(value: unknown): "true" | "false" {
  return value === true || value === "true" ? "true" : "false";
}

export function useZoteroReaderMode() {
  // Create the store once
  const store = useMemo(() => createReaderModeStore(), []);

  const __readerMode = useSyncExternalStore(store.subscribe, store.getSnapshot);

  const readerMode = __readerMode === "true";

  const setReaderMode = useCallback(
    (value: boolean) => {
      setPref("readerMode", value);
      store.notify();
    },
    [store],
  );

  return [readerMode, setReaderMode] as const;
}

export function createReaderModeStore() {
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function getSnapshot() {
    return toBooleanSnapshot(getPrefValue("readerMode"));
  }

  function subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);

    // Use Zotero's built-in preference observer
    const observerID = Zotero.Prefs.registerObserver(
      PREF_KEY,
      () => {
        notify();
      },
      true,
    );

    // Return an unsubscribe fn
    return () => {
      listeners.delete(onStoreChange);
      Zotero.Prefs.unregisterObserver(observerID);
    };
  }

  return { getSnapshot, subscribe, notify };
}
