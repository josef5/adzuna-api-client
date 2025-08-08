import { useEffect, useState } from "react";
import "./App.css";

type Job = {
  id: string;
  title: string;
  redirect_url: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
};

type Response = {
  results: Job[];
};

function App() {
  const [data, setData] = useState<Job[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        "https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=276f06d5&app_key=4d8ad3f833efde7607b09893735b52c7&results_per_page=500&what=frontend%20developer&where=london&content-type=application/json"
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const json: Response = await response.json();

      setData(json.results);
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Adzuna API Jobs</h1>
      </header>
      <ul>
        {data.map((job) => (
          <li key={job.id} className="mt-4">
            <h2 className="font-bold">{job.title}</h2>
            <p>{job.company.display_name}</p>
            <p>{job.location.display_name}</p>
            <p>{job.description}</p>
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Job
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  // return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default App;
