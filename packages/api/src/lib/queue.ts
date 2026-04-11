import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// ─── Job payload types ────────────────────────────────────────────────────────

export type ReminderType = '24h' | '1h' | 'post_visit';

export interface ReminderJobData {
  appointment_id: string;
  type: ReminderType;
}

// ─── Redis connection ─────────────────────────────────────────────────────────

// Returns the Redis connection URL from environment variables.
// Prefers Upstash REST URL, falls back to REDIS_URL, then localhost.
function getRedisUrl(): string {
  return (
    process.env['UPSTASH_REDIS_REST_URL'] ??
    process.env['REDIS_URL'] ??
    'redis://localhost:6379'
  );
}

let _redis: IORedis | null = null;

// Returns a singleton ioredis connection.
// Reuses the existing connection if already established.
export function getRedisConnection(): IORedis {
  if (_redis) return _redis;
  _redis = new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });
  return _redis;
}

// ─── Queue client ─────────────────────────────────────────────────────────────

export const QUEUE_NAME = 'appointment-reminders';

let _queue: Queue<ReminderJobData> | null = null;

// Returns the singleton reminder queue client.
// Safe to call multiple times — creates the queue only once.
export function getReminderQueue(): Queue<ReminderJobData> {
  if (_queue) return _queue;
  _queue = new Queue<ReminderJobData>(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    },
  });
  return _queue;
}

// ─── Scheduling helpers ───────────────────────────────────────────────────────

// Schedules the 24h and 1h reminder jobs for a confirmed appointment.
// Uses deterministic job IDs so scheduling is idempotent — calling this
// twice for the same appointment will not create duplicate jobs.
// appointment_id: the appointment to send reminders for
// start_datetime: when the appointment starts (UTC)
export async function scheduleReminders(
  appointment_id: string,
  start_datetime: Date,
): Promise<void> {
  const queue = getReminderQueue();
  const now = Date.now();

  const ms24h = start_datetime.getTime() - 24 * 60 * 60 * 1000;
  const ms1h = start_datetime.getTime() - 60 * 60 * 1000;
  const msPostVisit = start_datetime.getTime() + 3 * 60 * 60 * 1000; // 3h after start

  const jobs: Array<{ type: ReminderType; delay: number; jobId: string }> = [
    {
      type: '24h',
      delay: Math.max(0, ms24h - now),
      jobId: `${appointment_id}:24h`,
    },
    {
      type: '1h',
      delay: Math.max(0, ms1h - now),
      jobId: `${appointment_id}:1h`,
    },
    {
      type: 'post_visit',
      delay: Math.max(0, msPostVisit - now),
      jobId: `${appointment_id}:post_visit`,
    },
  ];

  await Promise.all(
    jobs
      .filter((j) => {
        // Only schedule jobs that haven't already passed
        if (j.type === '24h' && ms24h < now) return false;
        if (j.type === '1h' && ms1h < now) return false;
        if (j.type === 'post_visit' && msPostVisit < now) return false;
        return true;
      })
      .map((j) =>
        queue.add(
          'reminder',
          { appointment_id, type: j.type },
          { delay: j.delay, jobId: j.jobId },
        ),
      ),
  );
}

// Removes all pending reminder jobs for a cancelled or declined appointment.
// appointment_id: the appointment whose jobs should be cancelled
export async function cancelReminders(appointment_id: string): Promise<void> {
  const queue = getReminderQueue();
  const jobIds = [
    `${appointment_id}:24h`,
    `${appointment_id}:1h`,
    `${appointment_id}:post_visit`,
  ];

  await Promise.all(
    jobIds.map(async (jobId) => {
      const job = await queue.getJob(jobId);
      if (job) await job.remove();
    }),
  );
}

// Exports QueueEvents for monitoring (optional — used in admin tooling).
export { QueueEvents };
