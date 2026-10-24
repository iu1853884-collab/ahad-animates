import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { POST } from "../app/api/contact/route.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.CONTACT_EMAIL_FROM;
const originalTo = process.env.CONTACT_EMAIL_TO;

function validPayload(overrides = {}) {
  return {
    name: "Alex Client",
    email: "alex@example.com",
    subject: "Product animation",
    projectType: "3D Product Visualization",
    message: "I would like to discuss a product animation project.",
    ...overrides,
  };
}

function request(payload, ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(payload),
  });
}

function providerAccepted() {
  return new Response(JSON.stringify({ id: "resend-test-message-id" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_EMAIL_FROM;
  delete process.env.CONTACT_EMAIL_TO;
  globalThis.fetch = async () => providerAccepted();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
  if (originalFrom === undefined) delete process.env.CONTACT_EMAIL_FROM;
  else process.env.CONTACT_EMAIL_FROM = originalFrom;
  if (originalTo === undefined) delete process.env.CONTACT_EMAIL_TO;
  else process.env.CONTACT_EMAIL_TO = originalTo;
});

test("rejects invalid email without calling the email provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };

  const response = await POST(
    request(validPayload({ email: "not-an-email" })),
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid email/i);
  assert.equal(calls, 0);
});

test("rejects invalid names and project types without calling the provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };

  const invalidName = await POST(request(validPayload({ name: "A" })));
  const invalidType = await POST(
    request(validPayload({ projectType: "Unlisted service" })),
  );

  assert.equal(invalidName.status, 400);
  assert.match((await invalidName.json()).message, /name/i);
  assert.equal(invalidType.status, 400);
  assert.match((await invalidType.json()).message, /project type/i);
  assert.equal(calls, 0);
});

test("rejects unsafe subjects without calling the email provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };

  const response = await POST(
    request(validPayload({ subject: "Project\r\nBcc: attacker@example.com" })),
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /subject/i);
  assert.equal(calls, 0);
});

test("rejects oversized messages without calling the email provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };

  const response = await POST(
    request(validPayload({ message: "x".repeat(4001) })),
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /4000/i);
  assert.equal(calls, 0);
});

test("rejects honeypot submissions without calling the email provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };

  const response = await POST(request(validPayload({ website: "spam" })));

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("returns a configuration error when Resend is not configured", async () => {
  const response = await POST(request(validPayload()));

  assert.equal(response.status, 503);
  assert.equal((await response.json()).message.includes("ahadanimates@gmail.com"), true);
});

test("reports success only after provider acceptance and uses the public inbox by default", async () => {
  process.env.RESEND_API_KEY = "test-server-key";
  process.env.CONTACT_EMAIL_FROM = "website@verified.example";
  let sentRequest;
  globalThis.fetch = async (url, options) => {
    sentRequest = { url, options };
    return providerAccepted();
  };

  const response = await POST(request(validPayload()));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.sent, true);
  assert.equal(sentRequest.url, "https://api.resend.com/emails");
  assert.equal(
    new Headers(sentRequest.options.headers).get("Authorization"),
    "Bearer test-server-key",
  );
  assert.deepEqual(JSON.parse(sentRequest.options.body).to, ["ahadanimates@gmail.com"]);
  assert.equal(JSON.stringify(result).includes("test-server-key"), false);
});

test("returns a generic failure when the provider rejects the message", async () => {
  process.env.RESEND_API_KEY = "test-server-key";
  process.env.CONTACT_EMAIL_FROM = "website@verified.example";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ message: "private provider diagnostic" }),
      { status: 422 },
    );

  const response = await POST(request(validPayload()));
  const body = await response.text();

  assert.equal(response.status, 502);
  assert.equal(body.includes("private provider diagnostic"), false);
  assert.equal(body.includes("test-server-key"), false);
});

test("returns a generic failure when the provider request throws", async () => {
  process.env.RESEND_API_KEY = "test-server-key";
  process.env.CONTACT_EMAIL_FROM = "website@verified.example";
  globalThis.fetch = async () => {
    throw new Error("private network diagnostic");
  };

  const response = await POST(request(validPayload()));
  const body = await response.text();

  assert.equal(response.status, 502);
  assert.equal(body.includes("private network diagnostic"), false);
  assert.equal(body.includes("test-server-key"), false);
});

test("rate limits repeated requests from the same client", async () => {
  process.env.RESEND_API_KEY = "test-server-key";
  process.env.CONTACT_EMAIL_FROM = "website@verified.example";
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return providerAccepted();
  };
  const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  for (let i = 0; i < 5; i += 1) {
    assert.equal((await POST(request(validPayload(), ip))).status, 200);
  }
  const limited = await POST(request(validPayload(), ip));

  assert.equal(limited.status, 429);
  assert.equal(calls, 5);
});
