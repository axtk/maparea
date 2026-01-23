import type { MapArea, MapAreaOptions } from "../MapArea/index.ts";

export type AddPersistenceOptions = {
  storageKey?: string;
  session?: boolean;
};

/**
 * Enables persistence of the map's state across page reloads by saving it to
 * the browser storage (`localStorage` by default, `sessionStorage` with
 * `session` set to `true`).
 */
export function addPersistence(
  map: MapArea,
  { storageKey, session = false }: AddPersistenceOptions = {},
) {
  let storage = session ? window.sessionStorage : window.localStorage;
  let key =
    storageKey ?? ["maparea", map.container.id].filter(Boolean).join("#");

  let initialOptions = map.getOptions();
  let disabled = false;

  let write = () => {
    try {
      storage.setItem(key, JSON.stringify(map.getOptions()));
    } catch {}
  };

  let sync = () => {
    try {
      let rawOptions = storage.getItem(key);

      if (rawOptions === null) write();
      else map.setOptions(JSON.parse(rawOptions) as MapAreaOptions);
    } catch {}
  };

  let toggle = (value?: boolean) => {
    disabled = value === undefined ? !disabled : value;
  };

  let reset = () => {
    map.setOptions(initialOptions);
  };

  sync();

  let writeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Write to the browser storage on render at a throttled pace
  map.onRender(() => {
    if (disabled) return;

    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }

    writeTimeout = setTimeout(() => {
      writeTimeout = null;
      write();
    }, 350);
  });

  return {
    /**
     * Restores map options from the browser storage, or saves the
     * current map options to the storage if the storage entry is empty.
     */
    sync,
    /** Saves the current map options to the browser storage. */
    write,
    /** Enables and disables the persistence. */
    toggle,
    /** Resets the map to the initial options. */
    reset,
  };
}
