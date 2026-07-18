"use client";

import { useSyncExternalStore } from "react";

export function createLocalStore<T>(key: string, defaultValue: T) {
  const SERVER_HAS_NOT_HYDRATED = false;
  const STORE_EVENT = `${key}:changed`;

  function read(): T {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return defaultValue;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  function write(nextValue: T) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(nextValue));
    window.dispatchEvent(new Event(STORE_EVENT));
  }

  function subscribe(onStoreChange: () => void) {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleChange = () => onStoreChange();

    window.addEventListener("storage", handleChange);
    window.addEventListener(STORE_EVENT, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(STORE_EVENT, handleChange);
    };
  }

  function useStore() {
    const data = useSyncExternalStore(subscribe, read, () => defaultValue);
    
    const hasHydrated = useSyncExternalStore(
      subscribe,
      () => true,
      () => SERVER_HAS_NOT_HYDRATED
    );

    return { data, hasHydrated, write };
  }

  return { useStore, read, write, subscribe };
}
