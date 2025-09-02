import type { Tab } from "./types";

export const LOCAL_STORAGE_KEY = "adzunaIds";

export const TAB_OPTIONS: {
  key: Tab;
  tabLabel: string;
  addButtonLabel?: string;
  removeButtonLabel?: string;
}[] = [
  {
    key: "new",
    tabLabel: "New",
  },
  {
    key: "saved",
    tabLabel: "Saved",
    addButtonLabel: "Save",
    removeButtonLabel: "Unsave",
  },
  {
    key: "applied",
    tabLabel: "Applied",
    addButtonLabel: "Applied",
    removeButtonLabel: "Unapplied",
  },
  {
    key: "archived",
    tabLabel: "Archived",
    addButtonLabel: "Archive",
    removeButtonLabel: "Unarchive",
  },
] as const;
