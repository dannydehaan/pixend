export {};

declare global {
  interface Window {
    __TAURI_IPC__?: {
      invoke: <T = unknown>(args: { cmd: string; payload?: Record<string, unknown> }) => Promise<T>;
    };
  }
}
