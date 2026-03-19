import { decrypt, encrypt, EncryptedPayload } from './encryption';

const STORAGE_KEY = 'pixend_local_environments';

const isBrowser = () => typeof window !== 'undefined';

type StoredEnvironment = {
  id: string;
  name: string;
  encrypted_variables: EncryptedPayload;
};

export type DecryptedEnvironment = {
  id: string;
  name: string;
  variables: Record<string, string>;
};

const readStored = (): StoredEnvironment[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const writeStored = (payload: StoredEnvironment[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export async function saveEnvironmentToLocal(env: DecryptedEnvironment, userKey: CryptoKey): Promise<void> {
  if (!isBrowser()) return;
  const encrypted = await encrypt(env.variables, userKey);
  const stored = readStored();
  const next = stored.filter((item) => item.id !== env.id);
  next.push({
    id: env.id,
    name: env.name,
    encrypted_variables: encrypted,
  });
  writeStored(next);
}

export async function loadEnvironmentsLocal(userKey: CryptoKey): Promise<DecryptedEnvironment[]> {
  const stored = readStored();
  return Promise.all(
    stored.map(async (item) => ({
      id: item.id,
      name: item.name,
      variables: (await decrypt(item.encrypted_variables, userKey)) as Record<string, string>,
    })),
  );
}

export function deleteEnvironmentFromLocal(id: string): void {
  if (!isBrowser()) return;
  const stored = readStored().filter((env) => env.id !== id);
  writeStored(stored);
}
