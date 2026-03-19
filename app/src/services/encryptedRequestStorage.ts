import { request } from './api';
import { decrypt, encrypt, EncryptedPayload } from '../utils/encryption';
import { loadLocalRequests, saveToLocal } from '../utils/localStorage';

export type SecureRequestPayload = {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  authToken?: string;
  apiKey?: string;
};

export type StoredRequestRecord = {
  id: number;
  name?: string;
  encrypted_payload: EncryptedPayload;
  created_at?: string;
  updated_at?: string;
};

export type DecryptedRequestRecord = {
  id: number;
  name?: string;
  payload: SecureRequestPayload;
  createdAt?: string;
  updatedAt?: string;
};

const REQUESTS_ENDPOINT = '/requests';

export async function saveToApi(
  name: string,
  payload: SecureRequestPayload,
  userKey: CryptoKey,
): Promise<StoredRequestRecord> {
  const encrypted = await encrypt(payload, userKey);

  const response = await request<{ data: StoredRequestRecord }>(REQUESTS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      name,
      encrypted_payload: encrypted,
    }),
  });

  return response.body?.data as StoredRequestRecord;
}

export async function loadFromApi(userKey: CryptoKey): Promise<DecryptedRequestRecord[]> {
  const response = await request<{ data: StoredRequestRecord[] }>(REQUESTS_ENDPOINT, {
    method: 'GET',
  });

  const records = response.body?.data ?? [];
  const decrypted: DecryptedRequestRecord[] = [];

  for (const record of records) {
    try {
      const payload = (await decrypt(record.encrypted_payload, userKey)) as SecureRequestPayload;
      decrypted.push({
        id: record.id,
        name: record.name,
        payload,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      });
    } catch {
      // Skip entries that cannot be decrypted with the provided key
    }
  }

  return decrypted;
}

export async function saveRequest(
  name: string,
  payload: SecureRequestPayload,
  userKey: CryptoKey,
  isAuthenticated: boolean,
): Promise<StoredRequestRecord | void> {
  if (isAuthenticated) {
    return saveToApi(name, payload, userKey);
  }
  await saveToLocal({ name, ...payload }, userKey);
}

export async function loadRequests(userKey: CryptoKey, isAuthenticated: boolean): Promise<DecryptedRequestRecord[]> {
  if (isAuthenticated) {
    return loadFromApi(userKey);
  }

  const localRecords = await loadLocalRequests(userKey);
  // Normalize to DecryptedRequestRecord shape for downstream consumers
  return localRecords.map<DecryptedRequestRecord>((record) => ({
    id: record.id,
    name: record.name,
    payload: record.payload as SecureRequestPayload,
  }));
}
