import "server-only";
import { getResendClient } from "./resend";
import { EMAIL_FROM_ADDRESS, SHOP_ALERT_EMAIL } from "./config";
import { escapeHtml } from "./escapeHtml";

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export async function sendContactMessageEmail(
  submission: ContactSubmission
): Promise<{ error?: string }> {
  const client = getResendClient();
  if (!client) return { error: "Email is not configured. Please try again later." };
  if (!SHOP_ALERT_EMAIL) {
    console.warn("[email] ORDER_ALERT_EMAIL is not set — skipping contact form email.");
    return { error: "Email is not configured. Please try again later." };
  }

  const { name, email, phone, message } = submission;

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: SHOP_ALERT_EMAIL,
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    if (error) {
      console.error("[email] sendContactMessageEmail rejected by Resend:", JSON.stringify(error));
      return { error: "Failed to send your message. Please try again." };
    }
    console.log(`[email] sendContactMessageEmail sent, Resend id=${data?.id}`);
    return {};
  } catch (err) {
    console.error("[email] sendContactMessageEmail threw:", err);
    return { error: "Failed to send your message. Please try again." };
  }
}
