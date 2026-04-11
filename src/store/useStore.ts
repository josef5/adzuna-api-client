import { create } from "zustand";
import { PURGE_THRESHOLD } from "../constants";
import { isFrontendJob } from "../lib/utils";
import type { Job, PersistedJobState, Tab } from "../types";

interface Store extends PersistedJobState {
  savedIds: string[];
  appliedIds: string[];
  archivedIds: string[];

  newJobs: Job[];
  savedJobs: Job[];
  appliedJobs: Job[];
  archivedJobs: Job[];

  displayJobs: Job[];

  setSavedIds: (ids: string[]) => void;
  setAppliedIds: (ids: string[]) => void;
  setArchivedIds: (ids: string[]) => void;

  setJobs: (jobs: Job[]) => void;
  moveId: (type: Tab, id: string) => void;
  hydratePersistedState: (state: PersistedJobState) => void;
  resetState: () => void;

  tab: Tab;
  setTab: (tab: Tab) => void;

  showPurgeButton: boolean;
  purgeUnusedIds: (data: Job[]) => void;
}

function getAllJobs(
  state: Pick<Store, "newJobs" | "savedJobs" | "appliedJobs" | "archivedJobs">,
) {
  return [
    ...state.newJobs,
    ...state.savedJobs,
    ...state.appliedJobs,
    ...state.archivedJobs,
  ];
}

function getInitialState(): Omit<
  Store,
  | "setSavedIds"
  | "setAppliedIds"
  | "setArchivedIds"
  | "setJobs"
  | "moveId"
  | "hydratePersistedState"
  | "resetState"
  | "setTab"
  | "purgeUnusedIds"
> {
  return {
    savedIds: [],
    appliedIds: [],
    archivedIds: [],

    newJobs: [],
    savedJobs: [],
    appliedJobs: [],
    archivedJobs: [],

    displayJobs: [],

    tab: "new",
    showPurgeButton: false,
  };
}

export const useStore = create<Store>()((set, get) => ({
  ...getInitialState(),

  setSavedIds: (ids) => set({ savedIds: ids }),
  setAppliedIds: (ids) => set({ appliedIds: ids }),
  setArchivedIds: (ids) => set({ archivedIds: ids }),

  setJobs: (jobs) => {
    const { savedIds, appliedIds, archivedIds } = get();
    const allStoredIds = [...savedIds, ...appliedIds, ...archivedIds];

    const newJobs = jobs
      .filter((job) => !allStoredIds.includes(job.newId))
      .sort((a, b) => {
        // Sort by frontend jobs first
        const aFront = isFrontendJob(a.title) ? 1 : 0;
        const bFront = isFrontendJob(b.title) ? 1 : 0;
        if (aFront !== bFront) return bFront - aFront;

        // Then by date (newest first)
        const getTime = (job: Job) => {
          const d = job.created ?? "";
          const t = Date.parse(d);
          return Number.isNaN(t) ? 0 : t;
        };

        return getTime(b) - getTime(a);
      });

    const savedJobs = jobs.filter((job) => savedIds.includes(job.newId));
    const appliedJobs = jobs.filter((job) => appliedIds.includes(job.newId));
    const archivedJobs = jobs.filter((job) => archivedIds.includes(job.newId));

    set({
      newJobs,
      savedJobs,
      appliedJobs,
      archivedJobs,
      showPurgeButton: allStoredIds.length > jobs.length * PURGE_THRESHOLD,
    });

    // Trigger update of displayJobs based on current tab
    const { tab, setTab } = get();
    setTab(tab);
  },

  hydratePersistedState: (state) => {
    set({
      savedIds: [...state.savedIds],
      appliedIds: [...state.appliedIds],
      archivedIds: [...state.archivedIds],
      showPurgeButton: false,
    });

    get().setJobs(getAllJobs(get()));
  },

  resetState: () => {
    set(getInitialState());
  },

  setTab: (tab) => {
    const { newJobs, savedJobs, appliedJobs, archivedJobs } = get();

    let displayJobs: Job[] = [];

    switch (tab) {
      case "new":
        displayJobs = newJobs;
        break;
      case "saved":
        displayJobs = savedJobs;
        break;
      case "applied":
        displayJobs = appliedJobs;
        break;
      case "archived":
        displayJobs = archivedJobs;
        break;
      default:
        displayJobs = newJobs;
        break;
    }

    set({ tab, displayJobs });
  },

  moveId: (type: Tab, id: string) => {
    set((state) => {
      let savedIds = state.savedIds.filter((x) => x !== id);
      let appliedIds = state.appliedIds.filter((x) => x !== id);
      let archivedIds = state.archivedIds.filter((x) => x !== id);

      switch (type) {
        case "saved":
          savedIds = [...savedIds, id];
          break;
        case "applied":
          appliedIds = [...appliedIds, id];
          break;
        case "archived":
          archivedIds = [...archivedIds, id];
          break;
        default:
          break;
      }

      return { savedIds, appliedIds, archivedIds };
    });

    get().setJobs(getAllJobs(get()));
  },

  purgeUnusedIds: (jobs: Job[]) => {
    const usedIds = new Set(jobs.map((job) => job.newId));

    set((state) => ({
      savedIds: state.savedIds.filter((id) => usedIds.has(id)),
      appliedIds: state.appliedIds.filter((id) => usedIds.has(id)),
      archivedIds: state.archivedIds.filter((id) => usedIds.has(id)),
      showPurgeButton: false,
    }));
  },
}));
