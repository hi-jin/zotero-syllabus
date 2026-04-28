import { useCallback, useMemo } from "preact/hooks";
import { useSyncExternalStore } from "react-dom/src";
import { setPref, getPrefKey, getPrefValue } from "../../utils/prefs";

const PREF_KEY = getPrefKey("compactMode");

function toBooleanSnapshot(value: unknown): "true" | "false" {
  return value === true || value === "true" ? "true" : "false";
}

export function useZoteroCompactMode() {
  // Create the store once
  const store = useMemo(() => createCompactModeStore(), []);

  const __compactMode = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  const compactMode = __compactMode === "true";

  const setCompactMode = useCallback(
    (value: boolean) => {
      setPref("compactMode", value);
      store.notify();
    },
    [store],
  );

  return [compactMode, setCompactMode] as const;
}

export function createCompactModeStore() {
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function getSnapshot() {
    return toBooleanSnapshot(getPrefValue("compactMode"));
  }

  function subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);

    // Use Zotero's built-in preference observer
    const observerID = Zotero.Prefs.registerObserver(
      PREF_KEY,
      () => {
        ztoolkit.log("Compact mode preference changed");
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
