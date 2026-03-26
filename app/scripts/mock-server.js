import express from "express";
import fs from "fs";
import path from "path";

const portArg = process.argv[2];
const port = Number(portArg);
const appDirArg = process.argv[3];
const appDir = appDirArg ? path.resolve(appDirArg) : process.cwd();

if (!port || Number.isNaN(port)) {
  console.error("Missing port argument for mock server");
  process.exit(1);
}

const logDirectory = path.join(appDir, "runtime", "mock-requests");
fs.mkdirSync(logDirectory, { recursive: true });
const logPath = path.join(logDirectory, `${port}.jsonl`);
fs.writeFileSync(logPath, "", { encoding: "utf8" });

const normalizeHeaders = (headers) => {
  const normalized = {};
  Object.entries(headers ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        normalized[key] = value.join(", ");
      } else {
        normalized[key] = String(value);
      }
    });
  return normalized;
};

const logRequest = (req) => {
  const payload = {
    method: req.method,
    path: req.originalUrl,
    headers: normalizeHeaders(req.headers),
    body: typeof req.body === "string" ? req.body : req.body ?? undefined,
    timestamp: Date.now(),
  };
  fs.promises
    .appendFile(logPath, `${JSON.stringify(payload)}\n`)
    .catch((err) => console.error("Failed to log mock request", err));
};

const app = express();

app.use(express.text({ type: "*/*", limit: "4mb" }));

app.use((req, res) => {
  logRequest(req);
  res.json({
    message: "Mock server running",
    port,
  });
});

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Mock server listening on 127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.on("error", (error) => {
  console.error("Mock server error", error);
  process.exit(1);
});
