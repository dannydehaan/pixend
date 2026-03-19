export type PixRequestBody = {
  type: "json" | "raw";
  content: unknown;
};

export type PixRequest = {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: PixRequestBody;
};

export type PixCollection = {
  name: string;
  requests: PixRequest[];
};

export const PIX_VERSION = "1.0";
export const PIX_TYPE = "pix-collection";

export const exportCollection = (collection: PixCollection) => {
  const payload = {
    version: PIX_VERSION,
    type: PIX_TYPE,
    collection,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${collection.name.replace(/\s+/g, "_") || "collection"}.pix`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

const parseHeaders = (raw: unknown): Record<string, string> => {
  if (!Array.isArray(raw)) return {};
  return raw.reduce<Record<string, string>>((acc, header) => {
    if (header && typeof header === "object" && "key" in header && "value" in header) {
      const key = (header as { key?: string }).key?.toString().trim();
      const value = (header as { value?: string }).value?.toString().trim();
      if (key) {
        acc[key] = value ?? "";
      }
    }
    return acc;
  }, {});
};

const parseBody = (body: any): PixRequestBody | undefined => {
  if (!body) return undefined;
  if (typeof body === "string") {
    return { type: "raw", content: body };
  }
  if (body.mode === "raw" && typeof body.raw === "string") {
    try {
      return { type: "json", content: JSON.parse(body.raw) };
    } catch {
      return { type: "raw", content: body.raw };
    }
  }
  if (typeof body === "object") {
    return { type: "json", content: body };
  }
  return undefined;
};

const flattenPostmanItems = (items: any[]): any[] => {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (item.item) {
      return flattenPostmanItems(item.item);
    }
    return item;
  });
};

const buildPixRequest = (name: string, method: string, url: string, headers: Record<string, string>, body?: PixRequestBody): PixRequest => ({
  name: name || "Untitled Request",
  method: method || "GET",
  url: url || "",
  headers,
  body,
});

export const isPixCollectionFile = (data: unknown): data is { version: string; type: string; collection: { name: string; requests: PixRequest[] } } => {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>).type === PIX_TYPE &&
    typeof (data as Record<string, unknown>).version === "string" &&
    typeof (data as Record<string, unknown>).collection === "object"
  );
};

export const isPostmanCollectionFile = (data: unknown): data is { item: unknown[]; info?: { name?: string } } => {
  return typeof data === "object" && data !== null && Array.isArray((data as Record<string, unknown>).item);
};

export const isBrunoCollectionFile = (data: unknown): data is { requests?: unknown[]; collections?: unknown[] } => {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.requests)) return true;
  if (Array.isArray(record.collections)) return true;
  return false;
};

export const importPixCollection = (data: { version: string; type: string; collection: { name: string; requests: PixRequest[] } }): PixCollection => {
  const { collection } = data;
  return { name: collection.name, requests: collection.requests ?? [] };
};

export const importPostmanCollection = (data: any): PixCollection => {
  const requests = flattenPostmanItems(data.item)
    .map((entry) => {
      const request = (entry as { request?: any }).request;
      if (!request) return null;
      const urlRaw = typeof request.url === "string" ? request.url : request.url?.raw;
      const method = request.method ?? "GET";
      const name = entry.name ?? request.name ?? "Postman Request";
      const headers = parseHeaders(request.header ?? request.headers);
      const body = parseBody(request.body);
      return buildPixRequest(name, method, urlRaw ?? "", headers, body);
    })
    .filter((req): req is PixRequest => Boolean(req));

  return {
    name: data.info?.name ?? "Imported Postman Collection",
    requests,
  };
};

export const importBrunoCollection = (data: any): PixCollection => {
  const rawRequests = Array.isArray(data.requests)
    ? data.requests
    : Array.isArray(data.collections)
    ? data.collections.flatMap((collection: any) => collection.requests ?? [])
    : [];

  const requests = rawRequests
    .map((entry: any) => {
      const method = entry.method ?? entry.verb ?? "GET";
      const url = entry.url ?? entry.endpoint ?? "";
      const name = entry.name ?? `${method} ${url}`;
      const headers = (entry.headers ?? entry.header ?? []).reduce<Record<string, string>>((acc, header: any) => {
        if (typeof header === "object" && header.key) {
          acc[header.key] = header.value ?? "";
        }
        if (typeof header === "string") {
          const [key, value] = header.split(":");
          if (key) acc[key.trim()] = value?.trim() ?? "";
        }
        return acc;
      }, {});
      const body = parseBody(entry.body ?? entry.payload);
      return buildPixRequest(name, method, url, headers, body);
    })
    .filter((req): req is PixRequest => Boolean(req));

  return {
    name: data.name ?? "Imported Bruno Collection",
    requests,
  };
};

export const parseCollectionFile = (text: string): PixCollection => {
  const parsed = JSON.parse(text);
  if (isPixCollectionFile(parsed)) {
    return importPixCollection(parsed as any);
  }
  if (isPostmanCollectionFile(parsed)) {
    return importPostmanCollection(parsed);
  }
  if (isBrunoCollectionFile(parsed)) {
    return importBrunoCollection(parsed);
  }
  throw new Error("Unsupported collection format");
};
