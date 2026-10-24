const DEFAULT_EMAIL_RECIPIENT = "ahadanimates@gmail.com";
const RESEND_API_URL = "https://api.resend.com/emails";
const PROJECT_TYPES = new Set([
  "3D Product Visualization",
  "CGI Advertising",
  "3D Product Animation",
  "AI Ads & Hybrid Visuals",
  "Other Creative Inquiry",
]);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_CLIENTS = 1000;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  projectType?: unknown;
  message?: unknown;
  website?: unknown;
};

type ContactInput = {
  name: string;
  email: string;
  subject: string;
  projectType: string;
  message: string;
};

const submissions = new Map<string, number[]>();

function isLimited(clientKey: string, now: number): boolean {
  for (const [key, timestamps] of submissions) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );
    if (recent.length) submissions.set(key, recent);
    else submissions.delete(key);
  }

  if (!submissions.has(clientKey) && submissions.size >= RATE_LIMIT_MAX_CLIENTS) {
    const oldestKey = submissions.keys().next().value;
    if (oldestKey) submissions.delete(oldestKey);
  }

  const recent = submissions.get(clientKey) ?? [];
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) return true;
  submissions.set(clientKey, [...recent, now]);
  return false;
}

function invalid(message: string, status = 400): Response {
  return Response.json({ message }, { status });
}

function validatePayload(payload: ContactPayload): ContactInput | string {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const subject =
    typeof payload.subject === "string" ? payload.subject.trim() : "";
  const projectType =
    typeof payload.projectType === "string" ? payload.projectType : "";
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";

  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return "Enter a name between 2 and 100 characters.";
  }
  if (
    email.length > 254 ||
    /[\r\n\u0000-\u001f\u007f]/.test(email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return "Enter a valid email address.";
  }
  if (
    subject.length < 3 ||
    subject.length > 160 ||
    /[\r\n\u0000-\u001f\u007f]/.test(subject)
  ) {
    return "Enter a subject between 3 and 160 characters.";
  }
  if (!PROJECT_TYPES.has(projectType)) {
    return "Choose a valid project type.";
  }
  if (message.length < 10 || message.length > 4000) {
    return "Project details must be between 10 and 4000 characters.";
  }

  return { name, email, subject, projectType, message };
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) {
    return invalid("The inquiry is too large. Please shorten your message.", 413);
  }

  let payload: ContactPayload;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 8192) {
      return invalid("The inquiry is too large. Please shorten your message.", 413);
    }
    payload = JSON.parse(body) as ContactPayload;
  } catch {
    return invalid("Please submit a valid inquiry.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return invalid("Please submit a valid inquiry.");
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return invalid("Unable to submit this inquiry.");
  }

  const contact = validatePayload(payload);
  if (typeof contact === "string") return invalid(contact);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientKey =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isLimited(clientKey, Date.now())) {
    return invalid("Too many inquiries. Please wait a few minutes and try again.", 429);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  const to = process.env.CONTACT_EMAIL_TO || DEFAULT_EMAIL_RECIPIENT;
  if (!apiKey || !from) {
    return Response.json(
      {
        message:
          "Email delivery is not configured. Please contact the studio directly at ahadanimates@gmail.com.",
      },
      { status: 503 },
    );
  }

  try {
    const providerResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: contact.email,
        subject: `Project Inquiry: ${contact.subject}`,
        text: [
          `Name: ${contact.name}`,
          `Email: ${contact.email}`,
          `Project type: ${contact.projectType}`,
          `Subject: ${contact.subject}`,
          "",
          contact.message,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!providerResponse.ok) {
      return Response.json(
        {
          message:
            "The email provider could not accept your inquiry. Please try again or email ahadanimates@gmail.com.",
        },
        { status: 502 },
      );
    }

    const providerResult: unknown = await providerResponse.json().catch(() => null);
    if (
      !providerResult ||
      typeof providerResult !== "object" ||
      !("id" in providerResult) ||
      typeof providerResult.id !== "string" ||
      !providerResult.id
    ) {
      return Response.json(
        {
          message:
            "The email provider did not confirm acceptance. Please try again or email ahadanimates@gmail.com.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      sent: true,
      message:
        "Your inquiry was accepted by the email provider for delivery. This does not confirm inbox delivery.",
    });
  } catch {
    return Response.json(
      {
        message:
          "Email delivery is temporarily unavailable. Please try again or email ahadanimates@gmail.com.",
      },
      { status: 502 },
    );
  }
}
