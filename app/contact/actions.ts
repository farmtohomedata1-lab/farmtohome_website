"use server";

import { sendContactMessageEmail } from "@/lib/email/contactEmail";

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  // Honeypot — hidden from real users via CSS. A bot that fills every input
  // on the page fills this too; a real visitor never sees or touches it.
  company: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactForm(
  values: ContactFormValues
): Promise<{ error?: string }> {
  if (values.company.trim()) {
    // Pretend success so the bot doesn't learn the honeypot exists.
    return {};
  }

  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const message = values.message.trim();

  if (!name || !email || !phone || !message) {
    return { error: "Please fill in all fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length > 5000) {
    return { error: "Message is too long. Please keep it under 5000 characters." };
  }

  return sendContactMessageEmail({ name, email, phone, message });
}
