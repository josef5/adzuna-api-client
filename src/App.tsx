import { useEffect, useState } from "react";
import "./App.css";
import { useStore } from "./store/useStore";
import type { Job, Tab } from "./types";
import mockResponse from "./tests/mock-response.json";
import { TAB_OPTIONS } from "./constants";

type Response = {
  results: Job[];
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setJobs = useStore((state) => state.setJobs);
  const tab = useStore((state) => state.tab);
  const moveId = useStore((state) => state.moveId);
  const setTab = useStore((state) => state.setTab);
  const displayJobs = useStore((state) => state.displayJobs);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        /*/
        setJobs(mockResponse.results);
        /*/
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}?app_id=${
            import.meta.env.VITE_APP_ID
          }&app_key=${
            import.meta.env.VITE_APP_KEY
          }&results_per_page=100&what=frontend%20developer&where=london&sort_by=date&content-type=application/json`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const json: Response = await response.json();

        setJobs(json.results);
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
    };

    fetchData();
  }, [setJobs]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adzuna API Jobs</h1>
      </header>
      <div className="flex gap-4 mt-4" aria-label="Job Tabs">
        {TAB_OPTIONS.map(({ key, tabLabel }) => (
          <button
            key={key}
            className={`${
              tab === key ? "text-white" : "text-gray-400"
            } cursor-pointer`}
            onClick={() => setTab(key as Tab)}
          >
            {tabLabel}
          </button>
        ))}
        {/* TODO: Add refresh button */}
      </div>
      <hr className="my-1 border-gray-600" />
      {error ? (
        <div className="text-red-500 mt-4">Error: {error}</div>
      ) : loading ? (
        <div className="mt-4">Loading...</div>
      ) : (
        <>
          {displayJobs.length === 0 ? (
            <div className="mt-4">No new jobs available</div>
          ) : (
            <div className="">
        <ul>
          {displayJobs.map((job) => (
            <li key={job.id} className="mt-4">
              <h2 className="font-bold">{job.title}</h2>
              <p>{job.company.display_name}</p>
              <p>{job.location.display_name}</p>
              <p>{new Date(job.created).toLocaleDateString()}</p>
              {job.contract_type && <p>Contract: {job.contract_type}</p>}
              <p>{job.description}</p>
              <a
                href={job.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Job
              </a>
              {TAB_OPTIONS.slice(1).map(
                ({ key, addButtonLabel, removeButtonLabel }) => (
                  <button
                    key={key}
                    className={`ml-4 text-gray-400 cursor-pointer`}
                    onClick={() => {
                      if (tab === key) {
                        moveId("new", job.id);
                      } else {
                        moveId(key, job.id);
                      }
                    }}
                  >
                    {tab === key ? removeButtonLabel : addButtonLabel}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
