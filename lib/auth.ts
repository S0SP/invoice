const COOKIE_NAME = "uy_session";

const encoder = new TextEncoder();

async function getHMAC(message: string, secret: string): Promise<string> {
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const hmac = await getHMAC(value, getSecret());
  return `${value}.${hmac}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verify(token: string): Promise<boolean> {
  const [value, hmac] = token.split(".");
  if (!value || !hmac) return false;
  const expected = await getHMAC(value, getSecret());
  return timingSafeEqual(hmac, expected);
}

function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET is not set");
  return secret;
}

/** Checks the shared admin password (single login for the whole team). */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_ADMIN_PASSWORD;
  if (!expected) throw new Error("APP_ADMIN_PASSWORD is not set");
  return input === expected;
}

export async function createSessionCookieValue(): Promise<string> {
  return sign(`session-${Date.now()}`);
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  return verify(cookieValue);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
