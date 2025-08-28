import { useCallback, useEffect } from "react";
import "./App.css";
import { TAB_OPTIONS } from "./constants";
import { useFetchJobs } from "./hooks/useFetchJobs";
import { useStore } from "./store/useStore";
import type { Tab } from "./types";

// TODO: Add notification for new jobs
// TODO: Purge unused job ids from archive
function App() {
  const setJobs = useStore((state) => state.setJobs);
  const tab = useStore((state) => state.tab);
  const moveId = useStore((state) => state.moveId);
  const setTab = useStore((state) => state.setTab);
  const newJobs = useStore((state) => state.newJobs);
  const displayJobs = useStore((state) => state.displayJobs);
  const { data, fetchData, loading, error } = useFetchJobs();

  const handleRefresh = useCallback(() => {
    fetchData();
    setTab("new");
  }, [fetchData, setTab]);

  const handleNotification = useCallback(() => {
    if (newJobs.length > 0 && Notification.permission === "granted") {
      new Notification("New jobs available", {
        body: `There are ${newJobs.length} new job${newJobs.length > 1 ? "s" : ""} available.`,
      });
    }
  }, [newJobs.length]);

  useEffect(() => {
    if (data) {
      setJobs(data);
    }
  }, [data, setJobs]);

  // Fetch periodically
  useEffect(() => {
    const interval = setInterval(
      async function () {
        setTab("new");
        await fetchData();

        handleNotification();
      },
      60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [handleRefresh, fetchData, setTab, handleNotification]);

  // Request notification permission on mount
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Notification.requestPermission.length === 0) {
        // Modern promise-based API
        await Notification.requestPermission();
      }
    }

    if ("Notification" in window && Notification.permission !== "granted") {
      requestNotificationPermission();
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adzuna Frontend Developer Jobs in London</h1>
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
        <div className="mt-4 text-gray-400">Loading...</div>
      ) : (
        <>
          {displayJobs.length === 0 ? (
            <div className="mt-4 text-gray-400">{`No ${tab} jobs available`}</div>
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
                    <p>
                      {new Date(job.created).toLocaleString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {/* TODO: Better treatment for contract types */}
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
