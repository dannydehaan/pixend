import { deleteSecureValue, getSecureValue, setSecureValue } from "../utils/secureStorage";

const GUEST_KEY_NAME = "guest-encryption-key";

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (value: string) => {
  const binary = atob(value);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
};

export async function persistGuestKey(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey("raw", key);
  const serialized = arrayBufferToBase64(raw);
  await setSecureValue(GUEST_KEY_NAME, serialized);
}

export async function loadGuestKey(): Promise<CryptoKey | null> {
  const stored = await getSecureValue(GUEST_KEY_NAME);
  if (!stored) return null;
  const buffer = base64ToArrayBuffer(stored);
  return crypto.subtle.importKey("raw", buffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function ensureGuestKey(): Promise<CryptoKey> {
  const existing = await loadGuestKey();
  if (existing) {
    return existing;
  }

  const generated = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  await persistGuestKey(generated);
  return generated;
}

export async function clearGuestKey(): Promise<void> {
  await deleteSecureValue(GUEST_KEY_NAME);
}
