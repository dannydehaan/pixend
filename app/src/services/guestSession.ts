const GUEST_MODE_KEY = "pixend_guest_mode";

const isBrowser = () => typeof window !== "undefined";

const readFlag = (): boolean => {
  if (!isBrowser()) {
    return false;
  }

  try {
    return window.localStorage.getItem(GUEST_MODE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeFlag = (value: boolean) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(GUEST_MODE_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
};

let guestMode = readFlag();

export const getGuestMode = () => guestMode;

export const setGuestMode = (value: boolean) => {
  guestMode = value;
  writeFlag(value);
};

export const isGuestMode = getGuestMode;
