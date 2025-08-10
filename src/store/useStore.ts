import { create } from "zustand";
import type { Job } from "../types";

type Tab = "new" | "saved" | "applied" | "archived";

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
}

export const useStore = create<Store>((set, get) => ({
  savedIds: JSON.parse(localStorage.getItem("savedIds") || "[]"),
  appliedIds: JSON.parse(localStorage.getItem("appliedIds") || "[]"),
  archivedIds: JSON.parse(localStorage.getItem("archivedIds") || "[]"),

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
      .sort(
        // Newest jobs first
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );
    const savedJobs = jobs.filter((job) => savedIds.includes(job.id));
    const appliedJobs = jobs.filter((job) => appliedIds.includes(job.id));
    const archivedJobs = jobs.filter((job) => archivedIds.includes(job.id));

    set({
      newJobs,
      savedJobs,
      appliedJobs,
      archivedJobs,
      displayJobs: newJobs,
    });

    localStorage.setItem("savedIds", JSON.stringify(savedIds));
    localStorage.setItem("appliedIds", JSON.stringify(appliedIds));
    localStorage.setItem("archivedIds", JSON.stringify(archivedIds));
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
      console.log("Removing archived ID:", id);
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
}));
