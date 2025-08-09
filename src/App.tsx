import { useEffect, useState } from "react";
import "./App.css";
import useLocalStorage from "./hooks/useLocalStorage";

type Job = {
  id: string;
  title: string;
  redirect_url: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  created: string;
  contract_type?: string;
};

type Response = {
  results: Job[];
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Job[] | null>(null);
  const [newJobs, setNewJobs] = useState<Job[]>([]);
  const [archivedJobs, setArchivedJobs] = useState<Job[]>([]);
  const [archivedIds, setArchivedIds] = useLocalStorage<string[]>(
    "archivedIds",
    []
  );
  const [displayJobs, setDisplayJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState<"new" | "archived" | "saved" | "applied">(
    "new"
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=276f06d5&app_key=4d8ad3f833efde7607b09893735b52c7&results_per_page=100&what=frontend%20developer&where=london&sort_by=date&content-type=application/json"
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const json: Response = await response.json();

        setData(json.results);
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
  }, []);

  useEffect(() => {
    if (data) {
      setNewJobs(data.filter((job) => !archivedIds.includes(job.id)));
      setArchivedJobs(data.filter((job) => archivedIds.includes(job.id)));
    }
  }, [data, archivedIds]);

  useEffect(() => {
    if (tab === "new") {
      setDisplayJobs(newJobs);
    } else {
      setDisplayJobs(archivedJobs);
    }
  }, [tab, newJobs, archivedJobs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-gray-500">No data available</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adzuna API Jobs</h1>
      </header>
      <div className="flex gap-4 mt-4" aria-label="Job Tabs">
        <button
          className={`${
            tab === "new" ? "text-white" : "text-gray-400"
          } cursor-pointer`}
          onClick={() => setTab("new")}
        >
          New
        </button>
        <button
          className={`${
            tab === "archived" ? "text-white" : "text-gray-400"
          } cursor-pointer`}
          onClick={() => setTab("archived")}
        >
          Archived
        </button>
      </div>
      <hr className="my-1 border-gray-600" />
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
            <button
              className="ml-4 text-gray-500 cursor-pointer"
              onClick={() => {
                if (tab === "new") {
                  setArchivedIds((prev) => [...prev, job.id]);
                } else {
                  setArchivedIds((prev) => prev.filter((id) => id !== job.id));
                }
              }}
            >
              {tab === "new" ? "Archive" : "Unarchive"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default App;
