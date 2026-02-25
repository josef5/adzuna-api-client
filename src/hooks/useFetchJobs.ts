import { useCallback, useEffect, useState } from "react";
import type { Job } from "../types";
import { RESULTS_PER_PAGE } from "../constants";

type ApiResponse = {
  results: Job[];
};

export function useFetchJobs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Job[] | null>(null);
  const jobTitle = encodeURIComponent("Frontend Developer");
  const jobLocation = "London";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /*/
      setData((await import("../tests/mock-response.json")).default.results);
      /*/
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}?app_id=${
          import.meta.env.VITE_APP_ID
        }&app_key=${
          import.meta.env.VITE_APP_KEY
        }&what=${jobTitle}&where=${jobLocation}&sort_by=date&results_per_page=${RESULTS_PER_PAGE}&content-type=application/json`,
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const json: ApiResponse = await response.json();

      const jobsWithNewIds = addNewIds(json.results);
      const dedupedJobs = dedupeJobs(jobsWithNewIds);
      setData(dedupedJobs);
      //*/
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [jobTitle, jobLocation]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    fetchData,
    loading,
    error,
  };
}

function addNewIds(jobs: Job[]): Job[] {
  return jobs.map((job) => {
    const title = job.title ?? "";
    const company = job.company?.display_name ?? "";
    const location = job.location?.display_name ?? "";

    return {
      ...job,
      newId: `${title.trim().replace(/\s+/g, "-")}-${company.trim().replace(/\s+/g, "-")}-${location.trim().replace(/\s+/g, "-")}`,
    };
  });
}

function dedupeJobs(jobs: Job[]): Job[] {
  const uniqueIds = new Set<string>();

  return jobs.filter((job) => {
    if (uniqueIds.has(job.newId)) {
      return false;
    } else {
      uniqueIds.add(job.newId);
      return true;
    }
  });
}
