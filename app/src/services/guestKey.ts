const GUEST_KEY_STORAGE = 'guest_key';

const isBrowser = () => typeof window !== 'undefined';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
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
  if (!isBrowser()) return;
  const raw = await crypto.subtle.exportKey('raw', key);
  const serialized = arrayBufferToBase64(raw);
  window.localStorage.setItem(GUEST_KEY_STORAGE, serialized);
}

export async function loadGuestKey(): Promise<CryptoKey | null> {
  if (!isBrowser()) return null;
  const stored = window.localStorage.getItem(GUEST_KEY_STORAGE);
  if (!stored) return null;
  const buffer = base64ToArrayBuffer(stored);
  return crypto.subtle.importKey('raw', buffer, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function ensureGuestKey(): Promise<CryptoKey> {
  const existing = await loadGuestKey();
  if (existing) {
    return existing;
  }

  const generated = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  await persistGuestKey(generated);
  return generated;
}

export function clearGuestKey(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(GUEST_KEY_STORAGE);
}
