/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { opfsStorage } from "../store/opfsAdapter";

type WritableMock = {
  write: (value: string) => Promise<void>;
  close: () => Promise<void>;
};

type FileHandleMock = {
  getFile: () => Promise<{ text: () => Promise<string> }>;
  createWritable: () => Promise<WritableMock>;
};

type DirectoryHandleMock = {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileHandleMock>;
  removeEntry: (name: string) => Promise<void>;
};

const originalStorageDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "storage",
);

function setNavigatorStorageWithGetDirectory(
  getDirectory: () => Promise<DirectoryHandleMock>,
) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: {
      getDirectory,
    },
  });
}

function setNavigatorStorageWithoutOpfs() {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: {},
  });
}

afterEach(() => {
  vi.restoreAllMocks();

  if (originalStorageDescriptor) {
    Object.defineProperty(navigator, "storage", originalStorageDescriptor);
  } else {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: undefined,
    });
  }
});

describe("opfsStorage", () => {
  it("returns null when OPFS is unavailable", async () => {
    setNavigatorStorageWithoutOpfs();

    await expect(opfsStorage.getItem("jobs")).resolves.toBeNull();
    await expect(opfsStorage.setItem("jobs", "value")).resolves.toBeUndefined();
    await expect(opfsStorage.removeItem("jobs")).resolves.toBeUndefined();
  });

  it("reads from OPFS when available", async () => {
    const text = vi.fn().mockResolvedValue('{"savedIds":[]}');
    const getFile = vi.fn().mockResolvedValue({ text });
    const getFileHandle = vi.fn().mockResolvedValue({ getFile });
    const getDirectory = vi
      .fn<() => Promise<DirectoryHandleMock>>()
      .mockResolvedValue({
        getFileHandle,
        removeEntry: vi.fn().mockResolvedValue(undefined),
      });

    setNavigatorStorageWithGetDirectory(getDirectory);

    await expect(opfsStorage.getItem("adzunaIds")).resolves.toBe(
      '{"savedIds":[]}',
    );

    expect(getDirectory).toHaveBeenCalledTimes(1);
    expect(getFileHandle).toHaveBeenCalledWith("adzunaIds.json");
    expect(getFile).toHaveBeenCalledTimes(1);
    expect(text).toHaveBeenCalledTimes(1);
  });

  it("writes and removes entries when OPFS is available", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const createWritable = vi.fn().mockResolvedValue({ write, close });

    const getFileHandle = vi.fn().mockResolvedValue({ createWritable });
    const removeEntry = vi.fn().mockResolvedValue(undefined);

    const getDirectory = vi
      .fn<() => Promise<DirectoryHandleMock>>()
      .mockResolvedValue({ getFileHandle, removeEntry });

    setNavigatorStorageWithGetDirectory(getDirectory);

    await opfsStorage.setItem("cache", "payload");
    await opfsStorage.removeItem("cache");

    expect(getFileHandle).toHaveBeenCalledWith("cache.json", { create: true });
    expect(write).toHaveBeenCalledWith("payload");
    expect(close).toHaveBeenCalledTimes(1);
    expect(removeEntry).toHaveBeenCalledWith("cache.json");
  });

  it("swallows OPFS errors and returns safe values", async () => {
    const getDirectory = vi
      .fn<() => Promise<DirectoryHandleMock>>()
      .mockRejectedValue(new Error("opfs failed"));

    setNavigatorStorageWithGetDirectory(getDirectory);

    await expect(opfsStorage.getItem("jobs")).resolves.toBeNull();
    await expect(opfsStorage.setItem("jobs", "value")).resolves.toBeUndefined();
    await expect(opfsStorage.removeItem("jobs")).resolves.toBeUndefined();
  });
});
