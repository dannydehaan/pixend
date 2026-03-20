export const isPixendClient = () =>
  typeof window !== "undefined" && typeof (window as Window & { __TAURI__?: unknown }).__TAURI__ !== "undefined";

export const ensurePixendClient = () => {
  if (!isPixendClient()) {
    throw new Error("This feature is only available inside the Pixend client.");
  }
};
