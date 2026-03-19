export type HeaderCategory = "Common" | "Auth" | "Browser" | "Cache" | "HTTP2";

type HeaderDefinition = {
  name: string;
  description: string;
  category: HeaderCategory;
};

export const HEADER_DEFINITIONS: HeaderDefinition[] = [
  { name: "Accept", description: "Content types the client can handle", category: "Common" },
  { name: "Accept-Encoding", description: "Content codings the client supports", category: "Common" },
  { name: "Accept-Language", description: "Preferred languages", category: "Browser" },
  { name: "Authorization", description: "Credentials for authentication", category: "Auth" },
  { name: "Cache-Control", description: "Caching directives", category: "Cache" },
  { name: "Content-Length", description: "Length of the request body", category: "Common" },
  { name: "Content-Type", description: "Media type of the request body", category: "Common" },
  { name: "Cookie", description: "Cookies sent to the server", category: "Browser" },
  { name: "Date", description: "Date/time of the message", category: "Common" },
  { name: "Expect", description: "Additional requirements for server", category: "Common" },
  { name: "Forwarded", description: "Proxies that forwarded the request", category: "Browser" },
  { name: "From", description: "Email address of the user", category: "Browser" },
  { name: "Host", description: "Domain of the request", category: "Browser" },
  { name: "If-Match", description: "Update if resource matches", category: "Common" },
  { name: "If-Modified-Since", description: "Conditional GET", category: "Common" },
  { name: "If-None-Match", description: "Conditional GET", category: "Common" },
  { name: "If-Range", description: "Range requests", category: "Common" },
  { name: "If-Unmodified-Since", description: "Safe updates", category: "Common" },
  { name: "Origin", description: "Origin of cross-site request", category: "Browser" },
  { name: "Pragma", description: "Legacy cache control", category: "Cache" },
  { name: "Referer", description: "Address of referring document", category: "Browser" },
  { name: "User-Agent", description: "Client software info", category: "Browser" },
  { name: "Upgrade", description: "Protocol upgrades", category: "HTTP2" },
  { name: "Via", description: "Proxy chain", category: "Browser" },
  { name: "Warning", description: "Additional info about caching", category: "Cache" },
  { name: "X-Requested-With", description: "Used for AJAX requests", category: "Browser" },
  { name: "X-CSRF-Token", description: "CSRF protection token", category: "Auth" },
  { name: "X-API-Key", description: "API key", category: "Auth" },
  { name: "X-Forwarded-For", description: "Original client IP", category: "Browser" },
  { name: "X-Forwarded-Proto", description: "Original protocol", category: "Browser" },
  { name: ":method", description: "HTTP/2 pseudo header for method", category: "HTTP2" },
  { name: ":path", description: "Target path", category: "HTTP2" },
  { name: ":scheme", description: "URI scheme", category: "HTTP2" },
  { name: ":authority", description: "Server authority", category: "HTTP2" },
];

export const HEADER_VALUE_SUGGESTIONS: Record<string, string[]> = {
  Accept: [
    "application/json",
    "application/xml",
    "text/plain",
    "text/html",
    "application/pdf",
    "application/msword",
    "application/octet-stream",
  ],
  "Content-Type": [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
    "application/xml",
  ],
  Authorization: ["Bearer ", "Basic "],
  "Cache-Control": ["no-cache", "no-store", "max-age=0", "public", "private"],
  "Accept-Encoding": ["gzip", "deflate", "br"],
};
