import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../store/useStore";
const initialState = useStore.getState();

describe("store hydration behavior", () => {
  beforeEach(() => {
    useStore.setState(initialState, true);
  });

  it("hydrates only persisted ids and leaves ui state derived", () => {
    useStore.getState().hydratePersistedState({
      savedIds: ["saved-1"],
      appliedIds: ["applied-1"],
      archivedIds: ["archived-1"],
    });

    expect(useStore.getState().savedIds).toEqual(["saved-1"]);
    expect(useStore.getState().appliedIds).toEqual(["applied-1"]);
    expect(useStore.getState().archivedIds).toEqual(["archived-1"]);
    expect(useStore.getState().tab).toBe("new");
    expect(useStore.getState().displayJobs).toEqual([]);
  });

  it("resetState clears hydrated ids", () => {
    useStore.getState().hydratePersistedState({
      savedIds: ["saved-1"],
      appliedIds: ["applied-1"],
      archivedIds: ["archived-1"],
    });

    useStore.getState().resetState();

    expect(useStore.getState().savedIds).toEqual([]);
    expect(useStore.getState().appliedIds).toEqual([]);
    expect(useStore.getState().archivedIds).toEqual([]);
  });
});
