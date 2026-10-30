import nodemailer from "nodemailer";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254;
export const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

/** Returns null when email is not configured (no credentials in the environment). */
export function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  const host = process.env.SMTP_HOST; // optional: another provider, or a test server
  const transport = host
    ? nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user, pass }, tls: { rejectUnauthorized: process.env.SMTP_INSECURE !== "true" } })
    : nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return { transport, from: `"Hotel Videh Website" <${user}>` };
}

export function wrap(title: string, rows: [string, string][], note?: string) {
  const body = rows.map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#615C73;vertical-align:top">${esc(k)}</td><td style="padding:6px 0"><strong>${esc(v)}</strong></td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;color:#2B2540;max-width:560px"><h2 style="color:#2F3A8F;margin:0 0 12px">${esc(title)}</h2><table style="border-collapse:collapse;font-size:15px">${body}</table>${note ? `<p style="margin-top:18px;font-size:14px;color:#615C73">${esc(note)}</p>` : ""}</div>`;
}

// Simple per-visitor rate limit (in memory) so the forms can't be used to flood the inbox.
const hits = new Map<string, number[]>();
export function tooMany(req: Request, bucket: string, max = 5, windowMs = 60_000) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const key = `${bucket}:${ip}`, now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

// Email safety nets for the notification routes: never send more than `max` emails per hour for the whole site,
// and never email the same phone number twice within 10 minutes.
const sent: number[] = [];
const lastByKey = new Map<string, number>();
export function emailBudget(key?: string, max = 40) {
  const now = Date.now();
  while (sent.length && now - sent[0] > 3_600_000) sent.shift();
  if (sent.length >= max) return false;
  if (key) {
    if (now - (lastByKey.get(key) || 0) < 600_000) return false;
    lastByKey.set(key, now);
    if (lastByKey.size > 5000) lastByKey.clear();
  }
  sent.push(now);
  return true;
}

// ---- automatic confirmation email to the guest -----------------------------------------------------------
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://videhhotels.com").replace(/\/+$/, "");
/** First name only, with anything link-like removed, so the email can't carry someone else's message or URL. */
const safeFirst = (name: string) => (name.split(/\s+/)[0] || "").replace(/(https?:|www\.|[<>@/\\:])/gi, "").slice(0, 30) || "ji";

export function customerConfirmation(o: { name: string; phone: string; date: string; guests: string; ceremonies: string }) {
  const first = safeFirst(o.name);
  const when = /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? new Date(o.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : o.date;
  const rows: [string, string][] = [["Wedding date", when], ["Guests", o.guests], ["Ceremonies", o.ceremonies || "To be discussed"], ["We will call", `+91 ••••••${o.phone.slice(-4)}`]];
  const subject = "We’ve received your enquiry — Hotel Videh & Marriage Hall";
  const text = [
    `Namaste ${first},`, "",
    "Thank you for your enquiry at Hotel Videh & Marriage Hall, Madhubani. Our team will call you within one working day to confirm your date.", "",
    ...rows.map(([k, v]) => `${k}: ${v}`), "",
    "What happens next:", "1. We check that the hall is free on your date.", "2. We call you back to talk through guests, ceremonies, food and decoration.", "3. You visit the hall and confirm everything directly with us.", "",
    "Hotel Videh & Marriage Hall", "Khesra No. 2083, Ranti Road, Near Gumti No. 13, Madhubani, Bihar 847211", `${SITE}  ·  videhhotels@gmail.com`, "",
    "You received this email because this address was entered on an enquiry at videhhotels.com. If that wasn’t you, you can ignore it.",
  ].join("\n");
  const tr = rows.map(([k, v]) => `<tr><td style="padding:8px 16px 8px 0;color:#6A5A5E;font-size:14px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;font-size:15px;color:#2A1A1F"><strong>${esc(v)}</strong></td></tr>`).join("");
  const step = (n: number, t: string, d: string) => `<tr><td style="vertical-align:top;padding:0 12px 14px 0"><div style="width:28px;height:28px;border-radius:50%;background:#C62832;color:#fff;font:bold 14px/28px Arial;text-align:center">${n}</div></td><td style="padding:0 0 14px;font-size:14px;color:#6A5A5E;line-height:1.5"><strong style="color:#2A1A1F">${t}</strong><br>${d}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F6EEE3;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF8;border-radius:14px;overflow:hidden;border:1px solid #EFDCC6">
<tr><td style="background:#7B1E2E;padding:22px 28px;color:#fff"><div style="font-size:13px;letter-spacing:2px;color:#EDA621">शुभ विवाह</div><div style="font-size:22px;font-family:Georgia,serif;margin-top:4px">Hotel Videh &amp; Marriage Hall</div><div style="font-size:13px;opacity:.85;margin-top:2px">Ranti Road, Madhubani</div></td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:1.5px;color:#C62832;text-transform:uppercase;font-weight:bold">Enquiry received</p>
<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#4A1520">Namaste ${esc(first)},</h1>
<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#2A1A1F">Thank you for your enquiry. Our team will call you <strong>within one working day</strong> to confirm your date and talk through your wedding.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#FFF5E1;border-radius:10px;padding:8px 16px;margin:0 0 22px">${tr}</table>
<p style="margin:0 0 12px;font-size:15px;font-weight:bold;color:#7B1E2E">What happens next</p>
<table role="presentation" cellpadding="0" cellspacing="0">${step(1, "We check your date", "We confirm the hall is free on your lagan date.")}${step(2, "We call you back", "To talk through guests, ceremonies, food and decoration.")}${step(3, "Visit the hall", "Come and see the space, then confirm everything directly with us.")}</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr>
<td style="padding-right:8px"><a href="${SITE}/hall" style="display:inline-block;background:#C62832;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:bold;font-size:14px">See the hall</a></td>
<td><a href="${SITE}/visit" style="display:inline-block;border:1.5px solid #7B1E2E;color:#7B1E2E;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;font-size:14px">Get directions</a></td></tr></table>
</td></tr>
<tr><td style="padding:18px 28px;background:#FBF1E1;font-size:12.5px;color:#6A5A5E;line-height:1.6">Hotel Videh &amp; Marriage Hall · Khesra No. 2083, Ranti Road, Near Gumti No. 13, Madhubani, Bihar 847211<br>Questions? Just reply to this email or write to <a href="mailto:videhhotels@gmail.com" style="color:#7B1E2E">videhhotels@gmail.com</a>.<br><span style="color:#9a8a8e">You received this because this email address was entered on an enquiry at videhhotels.com. If that wasn’t you, you can ignore this email.</span></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
