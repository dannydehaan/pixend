import { listen } from '@tauri-apps/api/event';
import { ensurePixendClient, isPixendClient } from '../lib/tauriClient';

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

const invokeSpeedtestCommand = async <T>(cmd: string, payload?: Record<string, unknown>): Promise<T> => {
  const tauri = (window as Window & {
    __TAURI__?: {
      invoke: (args: { cmd: string; payload?: Record<string, unknown> }) => Promise<unknown>;
    };
  }).__TAURI__;
  if (!tauri) {
    throw new Error('Speedtest is only available inside the Pixend client.');
  }
  const response = await tauri.invoke({ cmd, payload });
  return response as T;
};

export const runSpeedtest = async () => {
  ensurePixendClient();
  return invokeSpeedtestCommand<void>('run_speedtest_command');
};

export const cancelSpeedtest = async () => {
  ensurePixendClient();
  return invokeSpeedtestCommand<boolean>('cancel_speedtest_command');
};

export const subscribeSpeedtest = <K extends EventName>(
  event: K,
  handler: (payload: EventPayloads[K]) => void,
) => {
  if (!isPixendClient()) {
    return () => undefined;
  }
  const unlistenPromise = listen(event, (eventPayload) => {
    handler(eventPayload.payload as EventPayloads[K]);
  });
  return () => unlistenPromise.then((unlisten) => unlisten());
};
