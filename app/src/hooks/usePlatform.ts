import { useEffect, useState } from "react";

export type PlatformVariant = "mac" | "windows" | "linux" | "unknown";

const normalizePlatform = (value?: string | null): PlatformVariant => {
  if (!value) {
    return "unknown";
  }
  const normalized = value.toLowerCase();
  if (normalized.includes("mac") || normalized.includes("darwin")) {
    return "mac";
  }
  if (normalized.includes("win")) {
    return "windows";
  }
  if (normalized.includes("linux")) {
    return "linux";
  }
  return "unknown";
};

const detectPlatform = (): PlatformVariant => {
  if (typeof navigator !== "undefined") {
    const { userAgentData, userAgent, platform } = navigator;
    const candidates = [userAgentData?.platform, platform, userAgent];
    for (const candidate of candidates) {
      const detected = normalizePlatform(candidate);
      if (detected !== "unknown") {
        return detected;
      }
    }
  }
  if (typeof process !== "undefined" && typeof process.platform === "string") {
    const detected = normalizePlatform(process.platform);
    if (detected !== "unknown") {
      return detected;
    }
  }
  return "unknown";
};

export const usePlatform = () => {
  const [platform, setPlatform] = useState<PlatformVariant>(() => detectPlatform());

  useEffect(() => {
    setPlatform((current) => {
      const detected = detectPlatform();
      return current === detected ? current : detected;
    });
  }, []);

  return platform;
};
