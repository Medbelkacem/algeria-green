import "server-only";

/**
 * Outbound mail. No SMTP provider is wired up in this release, so instead of
 * pretending a message was delivered, the link is written to the server log
 * and the caller is told delivery did not happen. Nothing is faked.
 */
export type MailResult = { delivered: boolean; reason?: "not_configured" };

export async function sendMail(message: { to: string; subject: string; body: string }): Promise<MailResult> {
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) {
    console.info(
      `[mail:not-configured] to=${message.to} subject="${message.subject}"\n${message.body}`,
    );
    return { delivered: false, reason: "not_configured" };
  }
  // A provider integration plugs in here; until one exists we never claim success.
  console.info(`[mail:pending-provider] to=${message.to} subject="${message.subject}"`);
  return { delivered: false, reason: "not_configured" };
}
