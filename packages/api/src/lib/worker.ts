/**
 * Appointment Reminder Worker
 *
 * Run this file as a standalone long-lived Node.js process alongside Next.js:
 *   node --loader ts-node/esm packages/api/src/lib/worker.ts
 *   (or compile first with tsc and run the output JS)
 *
 * The worker listens to the appointment-reminders BullMQ queue and dispatches
 * WhatsApp / SMS notifications via NotificationService.
 *
 * One instance is sufficient in production (BullMQ handles distributed locking).
 * Scale horizontally by running multiple instances — BullMQ ensures each job
 * is processed exactly once.
 */

import { Worker } from 'bullmq';
import { db } from '@appointly/db';
import { getRedisConnection, QUEUE_NAME, type ReminderJobData } from './queue.js';
import { notificationService } from './notifications.js';

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker<ReminderJobData>(
  QUEUE_NAME,
  async (job) => {
    const { appointment_id, type } = job.data;
    await processReminderJob(appointment_id, type);
  },
  {
    connection: getRedisConnection(),
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.info(`[worker] ✅ ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`[worker] ❌ ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[worker] Queue error:', err);
});

// eslint-disable-next-line no-console
console.info('[worker] Started — listening for appointment reminders…');

// ─── Job processor ────────────────────────────────────────────────────────────

// Loads the appointment from the database, verifies it is still CONFIRMED,
// then dispatches the appropriate notification type.
// appointment_id: the appointment to process
// type: which notification to send (24h reminder, 1h reminder, or post-visit)
async function processReminderJob(
  appointment_id: string,
  type: ReminderJobData['type'],
): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointment_id },
    include: {
      service: { select: { name: true } },
      staff: { select: { display_name: true } },
      salon: {
        select: {
          name: true,
          slug: true,
          timezone: true,
          settings: {
            select: {
              wa_reminder_template: true,
              wa_post_visit_template: true,
              wa_confirmation_template: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    // eslint-disable-next-line no-console
    console.warn(`[worker] Appointment ${appointment_id} not found — skipping`);
    return;
  }

  // Do not send reminders for cancelled/completed/no-show appointments
  if (appointment.status !== 'CONFIRMED') {
    // eslint-disable-next-line no-console
    console.info(
      `[worker] Appointment ${appointment_id} status=${appointment.status} — skipping ${type}`,
    );
    return;
  }

  const params = {
    to: appointment.customer_phone,
    customer_name: appointment.customer_name,
    salon_name: appointment.salon.name,
    service_name: appointment.service.name,
    staff_name: appointment.staff.display_name,
    start_datetime: appointment.start_datetime.toISOString(),
    timezone: appointment.salon.timezone,
    cancel_link: notificationService.buildCancelLink(appointment.cancel_token),
    rebook_link: notificationService.buildRebookLink(appointment.salon.slug),
    template: null as string | null,
  };

  if (type === '24h' || type === '1h') {
    params.template = appointment.salon.settings?.wa_reminder_template ?? null;
    await notificationService.sendReminder(params);

    // Mark the corresponding reminder as sent in DB
    const field = type === '24h' ? 'reminder_24h_sent' : 'reminder_1h_sent';
    await db.appointment.update({
      where: { id: appointment_id },
      data: { [field]: true },
    });
  } else if (type === 'post_visit') {
    params.template = appointment.salon.settings?.wa_post_visit_template ?? null;
    await notificationService.sendReminder(params);
  }
}

// Graceful shutdown — wait for in-flight jobs to complete before exiting
async function shutdown() {
  // eslint-disable-next-line no-console
  console.info('[worker] Shutting down gracefully…');
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
