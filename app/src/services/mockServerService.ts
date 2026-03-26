import { invoke } from "@tauri-apps/api/core";
import { getToken } from "./api";

const ensureApiBase = (): string => {
  const apiBase = import.meta.env.VITE_APP_API_BASE;
  if (!apiBase) {
    throw new Error("Missing VITE_APP_API_BASE environment variable");
  }
  return apiBase.replace(/\/+$/, "");
};

const getTokenOrThrow = async (): Promise<string> => {
  const token = await getToken();
  if (!token) {
    throw new Error("Missing authentication token");
  }
  return token;
};

export type MockServer = {
  id: number;
  name: string;
  port: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateMockServerPayload = {
  name: string;
  port: number;
};

export const fetchMockServers = async (): Promise<MockServer[]> => {
  const token = await getTokenOrThrow();
  const payload = await invoke("fetch_mock_servers", { apiBase: ensureApiBase(), token });
  return payload as MockServer[];
};

export const createMockServer = async (payload: CreateMockServerPayload): Promise<MockServer> => {
  const token = await getTokenOrThrow();
  const result = await invoke("create_mock_server", { apiBase: ensureApiBase(), token, payload });
  return result as MockServer;
};

export const deleteMockServer = async (id: number): Promise<boolean> => {
  const token = await getTokenOrThrow();
  const result = await invoke("delete_mock_server", { apiBase: ensureApiBase(), token, id });
  return result as boolean;
};

export const startMockServer = async (port: number): Promise<void> => {
  await invoke("start_mock_server", { port });
};

export const stopMockServer = async (port: number): Promise<boolean> => {
  const result = await invoke("stop_mock_server", { port });
  return result as boolean;
};

export const listRunningMockServers = async (): Promise<number[]> => {
  const result = await invoke("list_running_mock_servers");
  return (result as number[]) ?? [];
};

export type MockServerRequestDto = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string | null;
  timestamp: number;
  id?: string;
};

export type MockServerRequest = Omit<MockServerRequestDto, "id"> & {
  id: string;
};

const deriveRequestId = (request: MockServerRequestDto): string => {
  return (
    request.id ??
    `${request.timestamp}-${request.method}-${request.path}-${request.body ?? ""}`
  );
};

export const fetchMockServerRequests = async (port: number): Promise<MockServerRequest[]> => {
  const result = await invoke("fetch_mock_server_requests", { port });
  const payload = (result as MockServerRequestDto[]) ?? [];
  return payload.map((request) => ({
    ...request,
    id: deriveRequestId(request),
  }));
};

export const clearMockServerRequests = async (port: number): Promise<boolean> => {
  const result = await invoke("clear_mock_server_requests", { port });
  return Boolean(result);
};
