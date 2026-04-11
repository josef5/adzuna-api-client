/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import type { Job, Tab } from "../types";

const { mockSignInSocial, mockSignOut } = vi.hoisted(() => ({
  mockSignInSocial: vi.fn(),
  mockSignOut: vi.fn(),
}));

const mockSetJobs = vi.fn();
const mockMoveId = vi.fn();
const mockSetTab = vi.fn();
const mockPurgeUnusedIds = vi.fn();
const mockFetchData = vi.fn();

type StoreShape = {
  setJobs: typeof mockSetJobs;
  tab: Tab;
  moveId: typeof mockMoveId;
  setTab: typeof mockSetTab;
  newJobs: Job[];
  displayJobs: Job[];
  showPurgeButton: boolean;
  purgeUnusedIds: typeof mockPurgeUnusedIds;
};

const mockStoreState: StoreShape = {
  setJobs: mockSetJobs,
  tab: "new",
  moveId: mockMoveId,
  setTab: mockSetTab,
  newJobs: [],
  displayJobs: [],
  showPurgeButton: false,
  purgeUnusedIds: mockPurgeUnusedIds,
};

const mockHookState: {
  data: Job[] | null;
  fetchData: typeof mockFetchData;
  loading: boolean;
  error: string | null;
} = {
  data: null,
  fetchData: mockFetchData,
  loading: false,
  error: null,
};

const mockAuthState: {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    session: {
      id: string;
      userId: string;
      token: string;
      createdAt: Date;
      updatedAt: Date;
      expiresAt: Date;
    };
  } | null;
  isPending: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: ReturnType<typeof vi.fn>;
} = {
  data: {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    },
    session: {
      id: "session-1",
      userId: "user-1",
      token: "token",
      createdAt: new Date("2026-01-01T10:00:00Z"),
      updatedAt: new Date("2026-01-01T10:00:00Z"),
      expiresAt: new Date("2026-01-02T10:00:00Z"),
    },
  },
  isPending: false,
  isRefetching: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock("../store/useStore", () => ({
  useStore: (selector: (state: StoreShape) => unknown) =>
    selector(mockStoreState),
}));

vi.mock("../hooks/useFetchJobs", () => ({
  useFetchJobs: () => mockHookState,
}));

vi.mock("../lib/auth", () => ({
  authClient: {
    useSession: () => mockAuthState,
    signIn: {
      social: mockSignInSocial,
    },
    signOut: mockSignOut,
  },
}));

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id ?? "job-id-1",
    newId: overrides.newId ?? "job-new-id-1",
    title: overrides.title ?? "Frontend Developer",
    redirect_url: overrides.redirect_url ?? "https://example.com/job",
    company: overrides.company ?? { display_name: "Example Co" },
    location: overrides.location ?? { display_name: "London" },
    description: overrides.description ?? "Role details",
    created: overrides.created ?? "2026-01-01T10:00:00Z",
    contract_type: overrides.contract_type,
  };
}

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockSetJobs.mockReset();
    mockMoveId.mockReset();
    mockSetTab.mockReset();
    mockPurgeUnusedIds.mockReset();
    mockFetchData.mockReset();
    mockSignInSocial.mockReset();
    mockSignOut.mockReset();

    mockStoreState.tab = "new";
    mockStoreState.newJobs = [];
    mockStoreState.displayJobs = [];
    mockStoreState.showPurgeButton = false;

    mockHookState.data = null;
    mockHookState.loading = false;
    mockHookState.error = null;

    mockAuthState.data = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
      session: {
        id: "session-1",
        userId: "user-1",
        token: "token",
        createdAt: new Date("2026-01-01T10:00:00Z"),
        updatedAt: new Date("2026-01-01T10:00:00Z"),
        expiresAt: new Date("2026-01-02T10:00:00Z"),
      },
    };
    mockAuthState.isPending = false;
    mockAuthState.error = null;

    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
  });

  it("renders the GitHub login button when signed out", () => {
    mockAuthState.data = null;

    render(<App />);

    expect(screen.getByText("Log in with GitHub")).toBeTruthy();
  });

  it("clicking the GitHub login button starts Neon social sign-in", () => {
    mockAuthState.data = null;

    render(<App />);

    fireEvent.click(screen.getByText("Log in with GitHub"));

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "github" }),
    );
  });

  it("shows loading message when loading and no display jobs", () => {
    mockHookState.loading = true;

    render(<App />);

    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("refresh button triggers fetch and resets tab to new", () => {
    render(<App />);

    fireEvent.click(screen.getAllByText("Refresh")[0]);

    expect(mockFetchData).toHaveBeenCalledTimes(1);
    expect(mockSetTab).toHaveBeenCalledWith("new");
  });

  it("purge button appears and calls purgeUnusedIds with fetched data", () => {
    mockStoreState.showPurgeButton = true;
    mockHookState.data = [makeJob({ id: "1", newId: "job-1" })];

    render(<App />);

    fireEvent.click(screen.getByText("Purge Ids"));

    expect(mockPurgeUnusedIds).toHaveBeenCalledWith(mockHookState.data);
  });

  it("renders jobs count and job content for display list", () => {
    const jobs = [makeJob({ id: "1", newId: "job-1", title: "React Dev" })];
    mockStoreState.displayJobs = jobs;

    render(<App />);

    expect(screen.getByText("1 new jobs")).toBeTruthy();
    expect(screen.getByText("React Dev")).toBeTruthy();
    expect(screen.getByText("View Job")).toBeTruthy();
  });

  it("sign out button triggers auth sign out", () => {
    render(<App />);

    fireEvent.click(screen.getByText("Sign out"));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
