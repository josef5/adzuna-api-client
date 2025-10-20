import { create } from "zustand";
import { LOCAL_STORAGE_KEY, PURGE_THRESHOLD } from "../constants";
import { isFrontendJob } from "../lib/utils";
import type { Job, Tab } from "../types";

interface Store {
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

  tab: Tab;
  setTab: (tab: Tab) => void;

  showPurgeButton: boolean;
  purgeUnusedIds: (data: Job[]) => void;
}

export const useStore = create<Store>((set, get) => {
  const storedIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "{}");

  return {
    savedIds: storedIds.saved ?? [],
    appliedIds: storedIds.applied ?? [],
    archivedIds: storedIds.archived ?? [],

    newJobs: [],
    savedJobs: [],
    appliedJobs: [],
    archivedJobs: [],

    displayJobs: [],

    tab: "new",

    setSavedIds: (ids) => set({ savedIds: ids }),
    setAppliedIds: (ids) => set({ appliedIds: ids }),
    setArchivedIds: (ids) => set({ archivedIds: ids }),

    setJobs: (jobs) => {
      const { savedIds, appliedIds, archivedIds } = get();
      const allStoredIds = [...savedIds, ...appliedIds, ...archivedIds];

      const newJobs = jobs
        .filter((job) => !allStoredIds.includes(job.id))
        .sort((a, b) => {
          // Sort by frontend jobs first
          const aFront = isFrontendJob(a.title) ? 1 : 0;
          const bFront = isFrontendJob(b.title) ? 1 : 0;
          if (aFront !== bFront) return bFront - aFront;

          // Then by date (newest first)
          const getTime = (job: Job) => {
            const d = job.created ?? "";
            const t = Date.parse(d);
            return isNaN(t) ? 0 : t;
          };

          return getTime(b) - getTime(a);
        });

      const savedJobs = jobs.filter((job) => savedIds.includes(job.id));
      const appliedJobs = jobs.filter((job) => appliedIds.includes(job.id));
      const archivedJobs = jobs.filter((job) => archivedIds.includes(job.id));

      set({
        newJobs,
        savedJobs,
        appliedJobs,
        archivedJobs,
      });

      // Trigger update of displayJobs based on current tab
      const { tab, setTab } = get();
      setTab(tab);

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          saved: savedIds,
          applied: appliedIds,
          archived: archivedIds,
        }),
      );

      // Show purge button if there are significantly more stored IDs than jobs
      set({
        showPurgeButton: allStoredIds.length > jobs.length * PURGE_THRESHOLD,
      });
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

    moveId(type: Tab, id: string) {
      const {
        savedIds,
        appliedIds,
        archivedIds,
        setJobs,
        newJobs,
        savedJobs,
        appliedJobs,
        archivedJobs,
      } = get();

      // Remove the ID from all lists
      if (savedIds.includes(id)) {
        set({ savedIds: savedIds.filter((savedId) => savedId !== id) });
      }

      if (appliedIds.includes(id)) {
        set({ appliedIds: appliedIds.filter((appliedId) => appliedId !== id) });
      }

      if (archivedIds.includes(id)) {
        set({
          archivedIds: archivedIds.filter((archivedId) => archivedId !== id),
        });
      }

      // Add the ID to the specified list
      switch (type) {
        case "saved":
          set({ savedIds: [...savedIds, id] });
          break;
        case "applied":
          set({ appliedIds: [...appliedIds, id] });
          break;
        case "archived":
          set({ archivedIds: [...archivedIds, id] });
          break;
        default:
          break;
      }

      setJobs([...newJobs, ...savedJobs, ...appliedJobs, ...archivedJobs]);
    },

    showPurgeButton: false,

    purgeUnusedIds: (jobs: Job[]) => {
      const usedIds = jobs.map((job) => job.id);

      set((state) => ({
        savedIds: state.savedIds.filter((id) => usedIds.includes(id)),
        appliedIds: state.appliedIds.filter((id) => usedIds.includes(id)),
        archivedIds: state.archivedIds.filter((id) => usedIds.includes(id)),
        showPurgeButton: false,
      }));

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          saved: get().savedIds,
          applied: get().appliedIds,
          archived: get().archivedIds,
        }),
      );
    },
  };
});
