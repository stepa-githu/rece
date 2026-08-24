import { requireServerEnv } from "@/lib/env";

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function encryptionKey() {
  const raw = new TextEncoder().encode(requireServerEnv("TOKEN_ENCRYPTION_KEY"));
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptCredentials(value: Record<string, unknown>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), payload);
  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

export async function decryptCredentials<T extends Record<string, unknown>>(value: string): Promise<T> {
  const [version, iv, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !encrypted) throw new Error("Credenziali non leggibili.");
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, await encryptionKey(), fromBase64(encrypted));
  return JSON.parse(new TextDecoder().decode(clear)) as T;
}
