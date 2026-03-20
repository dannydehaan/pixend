import { listen } from '@tauri-apps/api/event';

type Listener = () => void;

type EventPayloads = {
  'speedtest-started': { timestamp: number };
  'speedtest-ping': { latency_ms: number };
  'speedtest-download': { phase: string; progress: number; kbps: number };
  'speedtest-upload': { phase: string; progress: number; kbps: number };
  'speedtest-completed': { latency_ms: number; download_kbps: number; upload_kbps: number };
  'speedtest-cancelled': { timestamp: number };
  'speedtest-failed': { error: string };
};

type EventName = keyof EventPayloads;

const isTauri = () => typeof window !== 'undefined' && typeof window.__TAURI_IPC__ !== 'undefined';

const invoke = async <T>(cmd: string, payload?: Record<string, unknown>): Promise<T> => {
  if (!isTauri()) {
    throw new Error('Speedtest is only available inside the Pixend client.');
  }
  const response = await window.__TAURI_IPC__?.invoke({ cmd, payload });
  return response as T;
};

export const runSpeedtest = async () => invoke<void>('run_speedtest_command');
export const cancelSpeedtest = async () => invoke<boolean>('cancel_speedtest_command');

export const subscribeSpeedtest = <K extends EventName>(
  event: K,
  handler: (payload: EventPayloads[K]) => void,
) => {
  if (!isTauri()) {
    return () => undefined;
  }
  const unlistenPromise = listen(event, (eventPayload) => {
    handler(eventPayload.payload as EventPayloads[K]);
  });
  return () => unlistenPromise.then((unlisten) => unlisten());
};
