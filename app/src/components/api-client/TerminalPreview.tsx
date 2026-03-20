import type { ReactNode } from "react";
import type { PlatformVariant } from "../../hooks/usePlatform";

const variantHeaders: Record<PlatformVariant, ReactNode> = {
  mac: (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
      <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
      <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
    </div>
  ),
  windows: (
    <div className="flex items-center gap-2">
      {["_", "X", "-"]?.map((symbol) => (
        <span
          key={symbol}
          className="flex h-5 w-5 items-center justify-center rounded-sm border border-white/20 text-[10px] font-semibold text-white"
        >
          {symbol}
        </span>
      ))}
    </div>
  ),
  linux: (
    <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
      <span>root@pixend</span>
    </div>
  ),
  unknown: (
    <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Terminal</div>
  ),
};

const variantCommand: Record<PlatformVariant, string> = {
  mac: "$ curl https://pixend.test/api/1.0/auth/login",
  windows: "PS> Invoke-WebRequest https://pixend.test/api/1.0/auth/login",
  linux: "$ curl https://pixend.test/api/1.0/auth/login",
  unknown: "$ curl https://pixend.test/api/1.0/auth/login",
};

const variantHeaderStyle: Record<PlatformVariant, string> = {
  mac: "bg-surface border border-surface-container-high",
  windows: "bg-[#0b151f] border border-[#192231] text-white",
  linux: "bg-[#1f2430] border border-[#2b3240]",
  unknown: "bg-surface border border-surface-container-high",
};

const variantLabel: Record<PlatformVariant, string> = {
  mac: "macOS Terminal",
  windows: "Windows Terminal",
  linux: "GNOME Terminal",
  unknown: "Terminal",
};

const variantBodyStyle: Record<PlatformVariant, string> = {
  mac: "bg-[#04060d] text-[#a2f8f5]",
  windows: "bg-[#050b13] text-[#89e5ff]",
  linux: "bg-[#0f131d] text-[#9ef0ff]",
  unknown: "bg-black/90 text-[#7ef2b7]",
};

const variantCommandStyle: Record<PlatformVariant, string> = {
  mac: "rounded-lg bg-black/60 p-3 text-[13px] text-white",
  windows: "rounded-lg bg-[#041027] p-3 text-[13px] text-white",
  linux: "rounded-lg bg-[#141a25] p-3 text-[13px] text-white",
  unknown: "rounded-lg bg-black/60 p-3 text-[13px] text-white",
};

const TerminalPreview = ({ variant }: { variant: PlatformVariant }) => (
  <div className="mt-3 rounded-2xl border border-on-surface-variant/40 bg-surface shadow-sm">
    <div className={`flex items-center justify-between px-3 py-2 ${variantHeaderStyle[variant]}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
        {variantLabel[variant]}
      </div>
      {variantHeaders[variant]}
    </div>
    <div className={`px-4 py-3 font-mono text-sm ${variantBodyStyle[variant]}`}>
      <div className="mb-2 text-xs uppercase tracking-[0.4em] text-white/70">API request preview</div>
      <div className={variantCommandStyle[variant]}>
        <p className="leading-relaxed">{variantCommand[variant]}</p>
      </div>
    </div>
  </div>
);

export default TerminalPreview;
