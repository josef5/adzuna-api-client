import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { useStore } from "../store/useStore";

const flush = () => new Promise((r) => setTimeout(r, 0));

type PersistApi = {
  setOptions: (options: {
    name?: string;
    storage?: ReturnType<typeof createJSONStorage>;
  }) => void;
  clearStorage: () => void | Promise<void>;
  rehydrate: () => void | Promise<void>;
};

type PersistedPayload = {
  state: {
    savedIds: string[];
    appliedIds: string[];
    archivedIds: string[];
  };
  version: number;
};

describe("store persistence (zustand persist)", () => {
  const getItem =
    vi.fn<(name: string) => string | Promise<string | null> | null>();
  const setItem =
    vi.fn<(name: string, value: string) => void | Promise<void>>();
  const removeItem = vi.fn<(name: string) => void | Promise<void>>();

  const memoryStorage: StateStorage = {
    getItem: (name) => getItem(name) as string | Promise<string | null> | null,
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => removeItem(name),
  };

  const persist = (useStore as unknown as { persist?: PersistApi }).persist;

  const getLastPersistedPayload = (): PersistedPayload => {
    const calls = setItem.mock.calls;
    const lastCall = calls[calls.length - 1];
    if (!lastCall?.[1]) {
      throw new Error("No persisted payload found");
    }
    return JSON.parse(lastCall[1]) as PersistedPayload;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    if (!persist) {
      throw new Error("useStore is not using zustand persist middleware");
    }

    persist.setOptions({
      name: "adzuna-persist-test",
      storage: createJSONStorage(() => memoryStorage),
    });

    await persist.clearStorage();
  });

  it("writes to configured storage when state mutates", async () => {
    useStore.getState().setSavedIds(["job-123"]);
    useStore.getState().setAppliedIds(["job-456"]);
    useStore.getState().setArchivedIds(["job-789"]);
    useStore.getState().setTab("applied");
    await flush();

    expect(setItem).toHaveBeenCalled();
    expect(setItem.mock.calls[0]?.[0]).toBe("adzuna-persist-test");

    const payload = getLastPersistedPayload();
    expect(payload.state).toEqual({
      savedIds: ["job-123"],
      appliedIds: ["job-456"],
      archivedIds: ["job-789"],
    });
    expect(payload.version).toBe(0);
    expect(payload.state).not.toHaveProperty("tab");
    expect(payload.state).not.toHaveProperty("displayJobs");
  });

  it("rehydrate reads from configured storage", async () => {
    if (!persist) {
      throw new Error("useStore is not using zustand persist middleware");
    }

    getItem.mockResolvedValueOnce(
      JSON.stringify({
        state: {
          // keep this minimal; merge behavior is store-defined
        },
        version: 0,
      }),
    );

    await persist.rehydrate();

    expect(getItem).toHaveBeenCalledWith("adzuna-persist-test");
  });

  it("clearStorage removes persisted entry from configured storage", async () => {
    if (!persist) {
      throw new Error("useStore is not using zustand persist middleware");
    }

    await persist.clearStorage();
    expect(removeItem).toHaveBeenCalledWith("adzuna-persist-test");
  });
});
