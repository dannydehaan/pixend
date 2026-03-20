export type NetworkLog = {
  id: string;
  method: string;
  originalUrl: string;
  proxyUrl: string;
  headers: Record<string, string>;
  body?: string;
  response?: string;
  status?: number;
  duration: number;
  timestamp: number;
};

let logs: NetworkLog[] = [];
const listeners = new Set<(logs: NetworkLog[]) => void>();

const notify = () => {
  listeners.forEach((listener) => listener(logs));
};

export const addNetworkLog = (log: NetworkLog) => {
  logs = [log, ...logs].slice(0, 200);
  notify();
};

export const clearNetworkLogs = () => {
  logs = [];
  notify();
};

export const subscribeNetworkLogs = (listener: (logs: NetworkLog[]) => void): (() => void) => {
  listeners.add(listener);
  listener(logs);
  return () => listeners.delete(listener);
};
