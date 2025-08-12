import { useEffect } from "react";
import "./App.css";
import { TAB_OPTIONS } from "./constants";
import { useFetchJobs } from "./hooks/useFetchJobs";
import { useStore } from "./store/useStore";
import type { Tab } from "./types";

function App() {
  const setJobs = useStore((state) => state.setJobs);
  const tab = useStore((state) => state.tab);
  const moveId = useStore((state) => state.moveId);
  const setTab = useStore((state) => state.setTab);
  const displayJobs = useStore((state) => state.displayJobs);
  const { data, fetchData, loading, error } = useFetchJobs();

  function handleRefresh() {
    fetchData();
    setTab("new");
  }

  useEffect(() => {
    if (data) {
      setJobs(data);
    }
  }, [data, setJobs]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adzuna API Jobs</h1>
      </header>
      <div className="mt-4 flex gap-4" aria-label="Job Tabs">
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
        <div className="flex-1" />
        <button
          className="cursor-pointer text-gray-400 hover:text-white"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
      <hr className="my-1 border-gray-600" />
      {error ? (
        <div className="mt-4 text-red-500">Error: {error}</div>
      ) : loading ? (
        <div className="mt-4">Loading...</div>
      ) : (
        <>
          {displayJobs.length === 0 ? (
            <div className="mt-4">{`No ${tab} jobs available`}</div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-400">
                {displayJobs.length} {tab} jobs
              </p>
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
                          className={`ml-4 cursor-pointer text-gray-400`}
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
                      ),
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
