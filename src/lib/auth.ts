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
const dataApiUrl =
  import.meta.env.VITE_NEON_DATA_API_URL ?? deriveDataApiUrl(authUrl);

if (!authUrl) {
  throw new Error("Missing VITE_NEON_AUTH_URL environment variable");
}

if (!dataApiUrl) {
  throw new Error("Missing VITE_NEON_DATA_API_URL environment variable");
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
