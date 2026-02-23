/* @vitest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFetchJobs } from "../hooks/useFetchJobs";
import type { Job } from "../types";

function makeApiJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id ?? "api-id-1",
    newId: "",
    title: overrides.title ?? "Frontend Developer",
    redirect_url: overrides.redirect_url ?? "https://example.com/jobs/1",
    company: overrides.company ?? { display_name: "Tech Co" },
    location: overrides.location ?? { display_name: "London" },
    description: overrides.description ?? "Role details",
    created: overrides.created ?? "2026-02-01T10:00:00Z",
    contract_type: overrides.contract_type,
  };
}

describe("useFetchJobs", () => {
  it("fetches, adds newId and deduplicates by derived ID", async () => {
    const jobs = [
      makeApiJob({ id: "1" }),
      makeApiJob({ id: "2" }),
      makeApiJob({
        id: "3",
        title: "Backend Engineer",
        company: { display_name: "Infra Co" },
      }),
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: jobs }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetchJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toHaveLength(2);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.[0].newId).toBe(
      "Frontend-Developer-Tech-Co-London",
    );
    expect(result.current.data?.[1].newId).toBe(
      "Backend-Engineer-Infra-Co-London",
    );
  });

  it("sets error when network response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useFetchJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Network response was not ok");
    });

    expect(result.current.data).toBeNull();
  });
});
