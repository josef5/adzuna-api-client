import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Redirect to HTTPS if not on localhost and currently using HTTP
if (!isLocalhost && window.location.protocol === "http:") {
  window.location.replace(window.location.href.replace(/^http:/, "https:"));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
