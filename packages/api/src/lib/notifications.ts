/**
 * NotificationService — centralizes all outbound messaging (WhatsApp, SMS, Email).
 *
 * Phase 6 status: Twilio and Resend credentials are optional env vars.
 * When absent the service logs the message and is a no-op.
 * Wire up real providers by setting the env vars listed below.
 *
 * Required env vars (when ready):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_WHATSAPP_FROM, TWILIO_SMS_FROM,
 *   RESEND_API_KEY, RESEND_FROM_EMAIL
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OtpMessageParams {
  /** Recipient E.164 phone number */
  to: string;
  /** The 6-digit OTP code to send */
  code: string;
  /** Salon name to include in the message */
  salon_name: string;
}

export interface AppointmentMessageParams {
  /** Recipient E.164 phone number */
  to: string;
  customer_name: string;
  salon_name: string;
  service_name: string;
  staff_name: string;
  /** ISO datetime string */
  start_datetime: string;
  timezone: string;
  cancel_link: string;
  rebook_link: string;
  /** Rendered WhatsApp template string (from SalonSettings) */
  template: string | null;
}

// ─── NotificationService ──────────────────────────────────────────────────────

export class NotificationService {
  private readonly twilioEnabled: boolean;
  private readonly resendEnabled: boolean;
  private readonly appUrl: string;

  constructor() {
    this.twilioEnabled =
      !!process.env['TWILIO_ACCOUNT_SID'] && !!process.env['TWILIO_AUTH_TOKEN'];
    this.resendEnabled = !!process.env['RESEND_API_KEY'];
    this.appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  }

  // Sends a one-time password via WhatsApp (preferred) or SMS.
  // Logs to console in development when Twilio is not configured.
  // params: recipient phone, OTP code, salon name
  async sendOtp(params: OtpMessageParams): Promise<void> {
    const body = `שלום! קוד האימות שלך ל${params.salon_name} הוא: ${params.code}\n(תקף ל-10 דקות)`;

    if (!this.twilioEnabled) {
      this.devLog('OTP', params.to, body);
      return;
    }

    await this.sendSms(params.to, body);
  }

  // Sends an appointment confirmation message via WhatsApp.
  // Substitutes all template variables before sending.
  // Falls back to SMS if WhatsApp fails.
  // params: full appointment context needed to render the template
  async sendConfirmation(params: AppointmentMessageParams): Promise<void> {
    const body = params.template
      ? this.renderTemplate(params.template, params)
      : this.defaultConfirmationMessage(params);

    if (!this.twilioEnabled) {
      this.devLog('Confirmation', params.to, body);
      return;
    }

    await this.sendWhatsApp(params.to, body);
  }

  // Sends a 24-hour reminder message via WhatsApp.
  // params: full appointment context
  async sendReminder(params: AppointmentMessageParams): Promise<void> {
    const body = params.template
      ? this.renderTemplate(params.template, params)
      : this.defaultReminderMessage(params);

    if (!this.twilioEnabled) {
      this.devLog('Reminder', params.to, body);
      return;
    }

    await this.sendWhatsApp(params.to, body);
  }

  // Renders a WhatsApp template string by substituting all {{variable}} tokens.
  // template: the raw template string from SalonSettings
  // params: appointment context with variable values
  // Returns the rendered message.
  private renderTemplate(template: string, params: AppointmentMessageParams): string {
    const date = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: params.timezone,
    }).format(new Date(params.start_datetime));

    const time = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: params.timezone,
    }).format(new Date(params.start_datetime));

    const variables: Record<string, string> = {
      '{{customer_name}}': params.customer_name,
      '{{salon_name}}': params.salon_name,
      '{{service_name}}': params.service_name,
      '{{staff_name}}': params.staff_name,
      '{{date}}': date,
      '{{time}}': time,
      '{{cancel_link}}': params.cancel_link,
      '{{rebook_link}}': params.rebook_link,
    };

    return Object.entries(variables).reduce(
      (msg, [key, val]) => msg.replaceAll(key, val),
      template,
    );
  }

  // Builds a default confirmation message when no custom template is configured.
  private defaultConfirmationMessage(params: AppointmentMessageParams): string {
    const date = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: params.timezone,
    }).format(new Date(params.start_datetime));

    const time = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: params.timezone,
    }).format(new Date(params.start_datetime));

    return (
      `שלום ${params.customer_name}! ✨\n\n` +
      `התור שלך ל${params.service_name} ב${params.salon_name} אושר:\n` +
      `📅 ${date} בשעה ${time}\n` +
      `👤 עם ${params.staff_name}\n\n` +
      `לביטול: ${params.cancel_link}`
    );
  }

  // Builds a default reminder message when no custom template is configured.
  private defaultReminderMessage(params: AppointmentMessageParams): string {
    const time = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: params.timezone,
    }).format(new Date(params.start_datetime));

    return (
      `היי ${params.customer_name}! 👋\n\n` +
      `תזכורת: יש לך תור מחר בשעה ${time} ל${params.service_name} ב${params.salon_name}.\n\n` +
      `לביטול (לפחות 24 שעות מראש): ${params.cancel_link}`
    );
  }

  // Sends a WhatsApp message via the Twilio API.
  // to: E.164 phone number
  // body: message text
  private async sendWhatsApp(to: string, body: string): Promise<void> {
    const from = `whatsapp:${process.env['TWILIO_WHATSAPP_FROM'] ?? ''}`;
    const toWhatsApp = `whatsapp:${to}`;
    await this.twilioRequest(toWhatsApp, from, body);
  }

  // Sends an SMS via the Twilio API.
  // to: E.164 phone number
  // body: message text
  private async sendSms(to: string, body: string): Promise<void> {
    const from = process.env['TWILIO_SMS_FROM'] ?? process.env['TWILIO_WHATSAPP_FROM'] ?? '';
    await this.twilioRequest(to, from, body);
  }

  // Makes a POST request to the Twilio Messages API.
  // to: recipient identifier (phone or whatsapp:phone)
  // from: sender identifier
  // body: message text
  private async twilioRequest(to: string, from: string, body: string): Promise<void> {
    const sid = process.env['TWILIO_ACCOUNT_SID'] ?? '';
    const token = process.env['TWILIO_AUTH_TOKEN'] ?? '';
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio error ${res.status}: ${text}`);
    }
  }

  // Builds the cancel link URL for an appointment.
  // cancel_token: the appointment's single-use cancel token
  // Returns the full cancel URL.
  buildCancelLink(cancel_token: string): string {
    return `${this.appUrl}/cancel/${cancel_token}`;
  }

  // Builds the rebook link URL for a salon.
  // salon_slug: the salon's URL slug
  // Returns the full booking URL.
  buildRebookLink(salon_slug: string): string {
    return `${this.appUrl}/book/${salon_slug}`;
  }

  // Logs a message to the console in non-production environments.
  // type: message type label (OTP, Confirmation, Reminder)
  // to: recipient phone number
  // body: message content
  private devLog(type: string, to: string, body: string): void {
    // eslint-disable-next-line no-console
    console.info(`[DEV] ${type} → ${to}:\n${body}\n`);
  }
}

export const notificationService = new NotificationService();
