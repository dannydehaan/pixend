export type HeaderEntry = {
  id: string;
  key: string;
  value: string;
};

export type BodyType = "none" | "json";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ResponsePayload = {
  status: number;
  headers: Record<string, string>;
  body: string;
  duration: number;
};

export type QueryParam = {
  id: string;
  key: string;
  value: string;
};
