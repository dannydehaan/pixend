import { decrypt, encrypt, EncryptedPayload } from './encryption';

const STORAGE_KEY = 'pixend_local_requests';

type StoredLocalRequest = {
  id: number;
  name?: string;
  encrypted_payload: EncryptedPayload;
};

export type DecryptedLocalRequest = {
  id: number;
  name?: string;
  payload: unknown;
};

const isBrowser = () => typeof window !== 'undefined';

const readStoredRequests = (): StoredLocalRequest[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistStoredRequests = (records: StoredLocalRequest[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export async function saveToLocal(requestData: unknown, userKey: CryptoKey): Promise<void> {
  if (!isBrowser()) return;
  const encrypted = await encrypt(requestData, userKey);
  const existing = readStoredRequests();
  existing.push({
    id: Date.now(),
    name: (requestData as { name?: string }).name,
    encrypted_payload: encrypted,
  });
  persistStoredRequests(existing);
}

export async function loadLocalRequests(userKey: CryptoKey): Promise<DecryptedLocalRequest[]> {
  const stored = readStoredRequests();
  return Promise.all(
    stored.map(async (item) => ({
      id: item.id,
      name: item.name,
      payload: await decrypt(item.encrypted_payload, userKey),
    })),
  );
}

export type { StoredLocalRequest };
