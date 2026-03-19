export type EncryptedPayload = {
  iv: number[];
  data: number[];
};

export async function encrypt(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
}

export async function decrypt(encryptedData: EncryptedPayload, key: CryptoKey): Promise<unknown> {
  const iv = new Uint8Array(encryptedData.iv);
  const data = new Uint8Array(encryptedData.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

export async function generateKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(password);

  return crypto.subtle.importKey(
    "raw",
    enc,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
