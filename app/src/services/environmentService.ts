import { request } from './api';
import { decrypt, encrypt, EncryptedPayload } from '../utils/encryption';
import {
  DecryptedEnvironment,
  loadEnvironmentsLocal,
  saveEnvironmentToLocal,
  deleteEnvironmentFromLocal,
} from '../utils/environmentStorage';

export type EnvironmentPayload = {
  id: string;
  name: string;
  variables: Record<string, string>;
};

type StoredEnvironmentRecord = {
  id: string;
  name: string;
  encrypted_variables: EncryptedPayload;
};

const ENDPOINT = '/secure-environments';

export async function saveEnvironmentToApi(env: DecryptedEnvironment, userKey: CryptoKey) {
  const encrypted = await encrypt(env.variables, userKey);
  const response = await request<{ data: StoredEnvironmentRecord }>(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      id: env.id,
      name: env.name,
      encrypted_variables: encrypted,
    }),
  });
  return response.body?.data as StoredEnvironmentRecord;
}

export async function loadEnvironmentsFromApi(userKey: CryptoKey): Promise<EnvironmentPayload[]> {
  const response = await request<{ data: StoredEnvironmentRecord[] }>(ENDPOINT, {
    method: 'GET',
  });
  const records = response.body?.data ?? [];
  const payloads: EnvironmentPayload[] = [];
  for (const record of records) {
    try {
      const variables = (await decrypt(record.encrypted_variables, userKey)) as Record<string, string>;
      payloads.push({ id: record.id, name: record.name, variables });
    } catch {
      // skip records we cannot decrypt
    }
  }
  return payloads;
}

export async function deleteEnvironmentFromApi(id: string) {
  await request(ENDPOINT + `/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function saveEnvironment(
  env: DecryptedEnvironment,
  userKey: CryptoKey,
  isAuthenticated: boolean,
): Promise<void> {
  if (isAuthenticated) {
    await saveEnvironmentToApi(env, userKey);
    return;
  }
  await saveEnvironmentToLocal(env, userKey);
}

export async function loadEnvironments(
  userKey: CryptoKey,
  isAuthenticated: boolean,
): Promise<EnvironmentPayload[]> {
  if (isAuthenticated) {
    return loadEnvironmentsFromApi(userKey);
  }
  return loadEnvironmentsLocal(userKey);
}

export async function deleteEnvironment(id: string, isAuthenticated: boolean): Promise<void> {
  if (isAuthenticated) {
    await deleteEnvironmentFromApi(id);
    return;
  }
  deleteEnvironmentFromLocal(id);
}

export function applyEnvironment(value: string, variables: Record<string, string> = {}): string {
  return value.replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key] ?? '');
}
