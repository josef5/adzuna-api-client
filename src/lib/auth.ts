import { createClient } from "@neondatabase/neon-js";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

type JobStateBucket = "saved" | "applied" | "archived";

export type NeonDatabase = {
  public: {
    Tables: {
      user_job_states: {
        Row: {
          user_id: string;
          job_id: string;
          bucket: JobStateBucket;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          job_id: string;
          bucket: JobStateBucket;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          job_id?: string;
          bucket?: JobStateBucket;
          updated_at?: string;
        };
      };
    };
  };
};

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
const configuredDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;
const dataApiUrl = resolveDataApiUrl(configuredDataApiUrl, authUrl);

if (!authUrl) {
  throw new Error("Missing VITE_NEON_AUTH_URL environment variable");
}

if (!dataApiUrl) {
  throw new Error("Missing VITE_NEON_DATA_API_URL environment variable");
}

function isHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

function resolveDataApiUrl(
  configuredUrl: string | undefined,
  fallbackAuthUrl: string | undefined,
) {
  if (isHttpUrl(configuredUrl)) {
    return configuredUrl;
  }

  if (configuredUrl) {
    const derivedUrl = deriveDataApiUrl(fallbackAuthUrl);

    if (derivedUrl) {
      console.warn(
        "Ignoring invalid VITE_NEON_DATA_API_URL. Expected an HTTP(S) Neon Data API endpoint, not a Postgres connection string.",
      );
      return derivedUrl;
    }

    throw new Error(
      "Invalid VITE_NEON_DATA_API_URL. Use your Neon Data API URL (https://...apirest.../rest/v1), not a postgresql:// connection string.",
    );
  }

  return deriveDataApiUrl(fallbackAuthUrl);
}

function deriveDataApiUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);

    parsedUrl.hostname = parsedUrl.hostname.replace(".neonauth.", ".apirest.");
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/auth\/?$/, "/rest/v1");

    return parsedUrl.toString();
  } catch {
    return undefined;
  }
}

export const neonClient = createClient<NeonDatabase>({
  auth: {
    url: authUrl,
    adapter: BetterAuthReactAdapter(),
  },
  dataApi: {
    url: dataApiUrl,
  },
});

export const authClient = neonClient.auth;
