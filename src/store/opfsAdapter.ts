import type { StateStorage } from "zustand/middleware";

const toFileName = (key: string) => `${key}.json`;

const hasOpfs = () =>
  typeof navigator !== "undefined" &&
  "storage" in navigator &&
  typeof navigator.storage?.getDirectory === "function";

export const opfsStorage: StateStorage = {
  getItem: async (name) => {
    if (!hasOpfs()) return null;

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(toFileName(name));
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  },

  setItem: async (name, value) => {
    if (!hasOpfs()) return;

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(toFileName(name), {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(value);
      await writable.close();
    } catch {
      // no-op
    }
  },

  removeItem: async (name) => {
    if (!hasOpfs()) return;

    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(toFileName(name));
    } catch {
      // no-op
    }
  },
};
