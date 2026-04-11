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
  user_id?: string;
  job_id: string;
  bucket: StorageBucket;
  updated_at?: string;
};

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

export async function getPersistedJobState(): Promise<PersistedJobState> {
  const { data, error } = await neonClient
    .from("user_job_states")
    .select("job_id, bucket, user_id, updated_at");

  if (error) {
    throw new Error(error.message);
  }

  return toPersistedJobState((data ?? []) as JobStateRow[]);
}

export async function savePersistedJobState(state: PersistedJobState) {
  const { error: deleteError } = await neonClient
    .from("user_job_states")
    .delete()
    .in("bucket", [...STORAGE_BUCKETS]);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const rows: JobStateInsert[] = [
    ...state.savedIds.map((job_id) => ({ job_id, bucket: "saved" as const })),
    ...state.appliedIds.map((job_id) => ({
      job_id,
      bucket: "applied" as const,
    })),
    ...state.archivedIds.map((job_id) => ({
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
}
