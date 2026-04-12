import { neonClient } from "./auth";
import type { PersistedJobState } from "../types";

const STORAGE_BUCKETS = ["saved", "applied", "archived"] as const;

type StorageBucket = (typeof STORAGE_BUCKETS)[number];

type JobStateRow = {
  user_id: string;
  job_id: string;
  bucket: StorageBucket;
  updated_at: string;
};

type JobStateInsert = {
  user_id: string;
  job_id: string;
  bucket: StorageBucket;
  updated_at?: string;
};

const RETRY_DELAYS_MS = [800, 1500, 3000, 5000, 8000];

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown Neon Data API error";
}

function isTransientError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const has5xxStatus = /\b5\d\d\b/.test(message);

  return (
    has5xxStatus ||
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("network") ||
    message.includes("fetch")
  );
}

async function withTransientRetry<T>(action: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(getErrorMessage(lastError));
}

function toPersistedJobState(rows: JobStateRow[]): PersistedJobState {
  return rows.reduce<PersistedJobState>(
    (state, row) => {
      switch (row.bucket) {
        case "saved":
          state.savedIds.push(row.job_id);
          break;
        case "applied":
          state.appliedIds.push(row.job_id);
          break;
        case "archived":
          state.archivedIds.push(row.job_id);
          break;
        default:
          break;
      }

      return state;
    },
    {
      savedIds: [],
      appliedIds: [],
      archivedIds: [],
    },
  );
}

export async function getPersistedJobState(
  userId: string,
): Promise<PersistedJobState> {
  return withTransientRetry(async () => {
    const { data, error } = await neonClient
      .from("user_job_states")
      .select("job_id, bucket, user_id, updated_at")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return toPersistedJobState((data ?? []) as JobStateRow[]);
  });
}

export async function savePersistedJobState(
  state: PersistedJobState,
  userId: string,
) {
  return withTransientRetry(async () => {
    const { error: deleteError } = await neonClient
      .from("user_job_states")
      .delete()
      .eq("user_id", userId)
      .in("bucket", [...STORAGE_BUCKETS]);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const rows: JobStateInsert[] = [
      ...state.savedIds.map((job_id) => ({
        user_id: userId,
        job_id,
        bucket: "saved" as const,
      })),
      ...state.appliedIds.map((job_id) => ({
        user_id: userId,
        job_id,
        bucket: "applied" as const,
      })),
      ...state.archivedIds.map((job_id) => ({
        user_id: userId,
        job_id,
        bucket: "archived" as const,
      })),
    ];

    if (rows.length === 0) {
      return state;
    }

    const { error: insertError } = await neonClient
      .from("user_job_states")
      .insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return state;
  });
}
