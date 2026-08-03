/**
 * Mailer with swappable drivers (selected via MAIL_DRIVER in .env):
 *   - log:      print to console + record in `sentMails` (dev / tests)
 *   - resend:   https://resend.com  (RESEND_API_KEY)
 *   - mailtrap: https://mailtrap.io (MAILTRAP_API_TOKEN, optional MAILTRAP_INBOX_ID
 *               for the sandbox/testing endpoint)
 * Zero dependencies — plain fetch.
 */
import { config } from './config'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

/** The log driver records sent mail here (assertable in dev and tests). */
export const sentMails: MailMessage[] = []

export async function sendMail(message: MailMessage): Promise<void> {
  switch (config.mail.driver) {
    case 'log':
      sentMails.push(message)
      console.log(formatMail(message))
      return
    case 'resend':
      await postJson('https://api.resend.com/emails', config.mail.resendApiKey, {
        from: config.mail.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
      })
      return
    case 'mailtrap': {
      const url = config.mail.mailtrapInboxId
        ? `https://sandbox.api.mailtrap.io/api/send/${config.mail.mailtrapInboxId}`
        : 'https://send.api.mailtrap.io/api/send'
      await postJson(url, config.mail.mailtrapToken, {
        from: { email: config.mail.from },
        to: [{ email: message.to }],
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
      })
      return
    }
  }
}

async function postJson(url: string, token: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Mail provider error ${res.status}: ${detail.slice(0, 200)}`)
  }
}

function formatMail(message: MailMessage): string {
  const body = (message.html ?? message.text).replace(/\n/g, '\n│ ')
  return [
    '┌─ mail (log driver) ────────────────────────────',
    `│ to:      ${message.to}`,
    `│ subject: ${message.subject}`,
    `│ ${body}`,
    '└────────────────────────────────────────────────',
  ].join('\n')
}
