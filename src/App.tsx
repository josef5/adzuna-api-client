import { useCallback, useEffect, useState } from "react";
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
  const newJobs = useStore((state) => state.newJobs);
  const displayJobs = useStore((state) => state.displayJobs);
  const showPurgeButton = useStore((state) => state.showPurgeButton);
  const purgeUnusedIds = useStore((state) => state.purgeUnusedIds);
  const { data, fetchData, loading, error } = useFetchJobs();
  const [lastFetchDate, setLastFetchDate] = useState<Date | null>(new Date());

  const handleRefresh = useCallback(() => {
    fetchData();
    setLastFetchDate(new Date());
    setTab("new");
  }, [fetchData, setTab]);

  const handleNotification = useCallback(() => {
    if (!("Notification" in window)) return;

    if (newJobs.length > 0 && Notification.permission === "granted") {
      new Notification(
        `${newJobs.length} new job${newJobs.length > 1 ? "s" : ""} available`,
      );
    }
  }, [newJobs.length]);

  function handlePurge() {
    purgeUnusedIds(data ?? []);
  }

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
        setLastFetchDate(new Date());

        handleNotification();
      },
      60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [fetchData, setTab, handleNotification]);

  // Request notification permission on mount
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Notification.requestPermission.length === 0) {
        await Notification.requestPermission();
      }
    }

    if ("Notification" in window) {
      console.log("Notification permission:", Notification.permission);

      if (Notification.permission !== "granted") {
        requestNotificationPermission();
      }
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
        {showPurgeButton && (
          <button
            className="cursor-pointer text-gray-400 hover:text-white"
            onClick={handlePurge}
          >
            Purge Ids
          </button>
        )}
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
      ) : (
        <>
          {displayJobs.length === 0 ? (
            <div className="mt-4 text-gray-400">
              {loading ? "Loading..." : `No ${tab} jobs available`}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-400">
                {loading ? "Loading..." : `${displayJobs.length} ${tab} jobs`}
              </p>
              <ul>
                {displayJobs.map((job) => (
                  <li key={job.id} className="mt-4">
                    <h2>
                      <span className="font-bold">{job.title}</span>
                      {job.contract_type && <span> - {job.contract_type}</span>}
                    </h2>
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
          {!loading && lastFetchDate && (
            <p className="mt-4 text-gray-400">
              Last updated:{" "}
              {lastFetchDate.toLocaleString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
