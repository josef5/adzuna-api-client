/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import type { Job } from "../types";
import { useStore } from "../store/useStore";

const initialState = useStore.getState();

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id ?? "id-1",
    newId: overrides.newId ?? "new-id-1",
    title: overrides.title ?? "Frontend Developer",
    redirect_url: overrides.redirect_url ?? "https://example.com/job",
    company: overrides.company ?? { display_name: "Example Co" },
    location: overrides.location ?? { display_name: "London" },
    description: overrides.description ?? "Job description",
    created: overrides.created ?? "2026-01-01T10:00:00Z",
    contract_type: overrides.contract_type,
  };
}

describe("useStore", () => {
  beforeEach(() => {
    useStore.setState(initialState, true);
    localStorage.clear();
  });

  it("sets and sorts new jobs by frontend-first then newest date", () => {
    const jobs = [
      makeJob({
        id: "b-1",
        newId: "backend-1",
        title: "Backend Engineer",
        created: "2026-01-03T10:00:00Z",
      }),
      makeJob({
        id: "f-1",
        newId: "react-1",
        title: "React Developer",
        created: "2026-01-02T10:00:00Z",
      }),
      makeJob({
        id: "f-2",
        newId: "vue-1",
        title: "Vue Engineer",
        created: "2026-01-04T10:00:00Z",
      }),
    ];

    useStore.getState().setJobs(jobs);

    expect(useStore.getState().newJobs.map((job) => job.newId)).toEqual([
      "vue-1",
      "react-1",
      "backend-1",
    ]);
    expect(useStore.getState().displayJobs.map((job) => job.newId)).toEqual([
      "vue-1",
      "react-1",
      "backend-1",
    ]);
  });

  it("toggles purge button when stored IDs exceed threshold", () => {
    useStore.setState({
      savedIds: ["a"],
      appliedIds: ["b"],
      archivedIds: [],
    });

    useStore.getState().setJobs([makeJob({ newId: "a", id: "1" })]);

    expect(useStore.getState().showPurgeButton).toBe(true);
  });

  it("moves an ID from new to saved and refreshes tab lists", () => {
    const newJob = makeJob({ id: "1", newId: "job-1" });
    useStore.getState().setJobs([newJob]);

    useStore.getState().moveId("saved", "job-1");

    expect(useStore.getState().savedIds).toEqual(["job-1"]);
    expect(useStore.getState().savedJobs.map((job) => job.newId)).toEqual([
      "job-1",
    ]);
    expect(useStore.getState().newJobs).toHaveLength(0);
  });

  it("purges unused IDs", () => {
    useStore.setState({
      savedIds: ["keep-saved", "remove-saved"],
      appliedIds: ["keep-applied", "remove-applied"],
      archivedIds: ["remove-archived"],
      showPurgeButton: true,
    });

    const activeJobs = [
      makeJob({ id: "1", newId: "keep-saved" }),
      makeJob({ id: "2", newId: "keep-applied" }),
    ];

    useStore.getState().purgeUnusedIds(activeJobs);

    expect(useStore.getState().savedIds).toEqual(["keep-saved"]);
    expect(useStore.getState().appliedIds).toEqual(["keep-applied"]);
    expect(useStore.getState().archivedIds).toEqual([]);
    expect(useStore.getState().showPurgeButton).toBe(false);
  });
});
