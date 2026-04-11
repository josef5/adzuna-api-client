/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import type { Job, PersistedJobState } from "../types";
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

  it("hydrates persisted ids and reclassifies existing jobs", () => {
    const jobs = [
      makeJob({ id: "1", newId: "saved-job" }),
      makeJob({ id: "2", newId: "applied-job" }),
      makeJob({ id: "3", newId: "archived-job" }),
      makeJob({ id: "4", newId: "new-job" }),
    ];
    const persistedState: PersistedJobState = {
      savedIds: ["saved-job"],
      appliedIds: ["applied-job"],
      archivedIds: ["archived-job"],
    };

    useStore.getState().setJobs(jobs);
    useStore.getState().hydratePersistedState(persistedState);

    expect(useStore.getState().savedJobs.map((job) => job.newId)).toEqual([
      "saved-job",
    ]);
    expect(useStore.getState().appliedJobs.map((job) => job.newId)).toEqual([
      "applied-job",
    ]);
    expect(useStore.getState().archivedJobs.map((job) => job.newId)).toEqual([
      "archived-job",
    ]);
    expect(useStore.getState().newJobs.map((job) => job.newId)).toEqual([
      "new-job",
    ]);
  });

  it("resetState clears ids and derived job lists", () => {
    const job = makeJob({ id: "1", newId: "job-1" });

    useStore.getState().setJobs([job]);
    useStore.getState().moveId("saved", "job-1");
    useStore.getState().setTab("saved");
    useStore.getState().resetState();

    expect(useStore.getState().savedIds).toEqual([]);
    expect(useStore.getState().appliedIds).toEqual([]);
    expect(useStore.getState().archivedIds).toEqual([]);
    expect(useStore.getState().savedJobs).toEqual([]);
    expect(useStore.getState().displayJobs).toEqual([]);
    expect(useStore.getState().tab).toBe("new");
  });
});
