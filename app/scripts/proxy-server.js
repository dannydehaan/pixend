import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const PORT = Number(process.env.PIXEND_PROXY_PORT ?? 7777);
const PROXY_TARGET_ENV = process.env.PIXEND_PROXY_TARGET || "https://api.pixend.io";
const PORTAL_PATH = "/proxy";
const TARGET_HEADER = "x-pixend-target-url";

const ensureUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const resolveTargetUrl = (req) => {
  const candidate = req.headers[TARGET_HEADER];
  if (Array.isArray(candidate) ? candidate[0] : candidate) {
    const headerValue = Array.isArray(candidate) ? candidate[0] : candidate;
    const url = ensureUrl(headerValue);
    if (url) return url;
  }
  const fallback = ensureUrl(PROXY_TARGET_ENV);
  return fallback ?? null;
};

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(PORTAL_PATH, (req, _res, next) => {
  const target = resolveTargetUrl(req);
  if (target) {
    console.log(
      `[proxy] ${req.method} ${target.toString()} (from ${req.originalUrl})`,
    );
  } else {
    console.log(`[proxy] ${req.method} ${req.originalUrl} (missing target)`);
  }
  next();
});

app.use(
  PORTAL_PATH,
  createProxyMiddleware({
    target: "http://localhost",
    changeOrigin: true,
    router: (req) => {
      const target = resolveTargetUrl(req);
      return target?.origin ?? "http://localhost";
    },
    pathRewrite: (path, req) => {
      const target = resolveTargetUrl(req);
      if (!target) return path.replace(new RegExp(`^${PORTAL_PATH}`), "");
      return `${target.pathname}${target.search}`;
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.removeHeader(TARGET_HEADER);
    },
    onProxyRes: (proxyRes, req) => {
      const target = resolveTargetUrl(req);
      console.log(
        `[proxy] response ${proxyRes.statusCode} ${target ? target.toString() : req.originalUrl}`,
      );
    },
    logLevel: "warn",
  }),
);

app.listen(PORT, () => {
  console.log(`Pixend proxy listening on http://localhost:${PORT}${PORTAL_PATH}`);
});
