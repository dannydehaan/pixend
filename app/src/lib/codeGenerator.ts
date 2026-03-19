import type { QueryParam } from "../components/api-client/types";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = Record<string, JsonValue>;

export type CodeGeneratorRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: QueryParam[];
  body?: string;
};

export type CodeOption = {
  language: string;
  framework: string;
  id: string;
};

export type LanguageGroup = {
  language: string;
  options: CodeOption[];
};

const OPTIONS: LanguageGroup[] = [
  {
    language: "C#",
    options: [
      { id: "csharp-httpclient", language: "C#", framework: "HttpClient" },
      { id: "csharp-restsharp", language: "C#", framework: "RestSharp" },
    ],
  },
  {
    language: "cURL",
    options: [{ id: "curl", language: "cURL", framework: "cURL" }],
  },
  {
    language: "Dart",
    options: [
      { id: "dart-dio", language: "Dart", framework: "Dio" },
      { id: "dart-http", language: "Dart", framework: "HTTP" },
    ],
  },
  {
    language: "Go",
    options: [{ id: "go-http", language: "Go", framework: "http package" }],
  },
  {
    language: "HTTP",
    options: [{ id: "raw-http", language: "HTTP", framework: "Raw HTTP request" }],
  },
  {
    language: "Java",
    options: [
      { id: "java-okhttp", language: "Java", framework: "OkHttp" },
      { id: "java-unirest", language: "Java", framework: "Unirest" },
    ],
  },
  {
    language: "JavaScript",
    options: [
      { id: "js-fetch", language: "JavaScript", framework: "Fetch" },
      { id: "js-jquery", language: "JavaScript", framework: "jQuery" },
      { id: "js-xhr", language: "JavaScript", framework: "XHR" },
    ],
  },
  {
    language: "Kotlin",
    options: [{ id: "kotlin-okhttp", language: "Kotlin", framework: "OkHttp" }],
  },
  {
    language: "C",
    options: [{ id: "c-libcurl", language: "C", framework: "LibCurl" }],
  },
  {
    language: "NodeJS",
    options: [
      { id: "node-axios", language: "NodeJS", framework: "Axios" },
      { id: "node-native", language: "NodeJS", framework: "Native (http/https)" },
      { id: "node-request", language: "NodeJS", framework: "Request" },
      { id: "node-unirest", language: "NodeJS", framework: "Unirest" },
    ],
  },
  {
    language: "Objective-C",
    options: [{ id: "objc-nsurlsession", language: "Objective-C", framework: "NSURLSession" }],
  },
  {
    language: "OCaml",
    options: [{ id: "ocaml-cohttp", language: "OCaml", framework: "Cohttp" }],
  },
  {
    language: "PHP",
    options: [
      { id: "php-curl", language: "PHP", framework: "cURL" },
      { id: "php-guzzle", language: "PHP", framework: "Guzzle" },
      { id: "php-http-request2", language: "PHP", framework: "Http_Request2" },
      { id: "php-pecl-http", language: "PHP", framework: "pecl_http" },
    ],
  },
  {
    language: "Postman CLI",
    options: [{ id: "postman-cli", language: "Postman CLI", framework: "Postman CLI" }],
  },
  {
    language: "PowerShell",
    options: [{ id: "powershell-invoke-restmethod", language: "PowerShell", framework: "Invoke-RestMethod" }],
  },
  {
    language: "Python",
    options: [
      { id: "python-http-client", language: "Python", framework: "http.client" },
      { id: "python-requests", language: "Python", framework: "Requests" },
    ],
  },
  {
    language: "R",
    options: [
      { id: "r-httr", language: "R", framework: "httr" },
      { id: "r-rcurl", language: "R", framework: "RCurl" },
    ],
  },
  {
    language: "Ruby",
    options: [{ id: "ruby-net-http", language: "Ruby", framework: "Net::HTTP" }],
  },
  {
    language: "Rust",
    options: [{ id: "rust-reqwest", language: "Rust", framework: "reqwest" }],
  },
  {
    language: "Shell",
    options: [
      { id: "shell-httpie", language: "Shell", framework: "HTTPie" },
      { id: "shell-wget", language: "Shell", framework: "wget" },
    ],
  },
  {
    language: "Swift",
    options: [{ id: "swift-urlsession", language: "Swift", framework: "URLSession" }],
  },
];

const tryParseJson = (value: string | undefined) => {
  if (!value || !value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const escapeString = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");

const buildHeaderObject = (headers: [string, string][]) =>
  headers.length === 0 ? "{}" : `{
${headers.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n")}
}`;

const buildHeaderDictionary = (headers: [string, string][]) =>
  headers.length === 0 ? "{}" : `{
${headers.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n")}
}`;

const buildHeadersArray = (headers: [string, string][]) => headers.map(([key, value]) => `${key}: ${value}`);

const normalizeHeaders = (headers: Record<string, string>) =>
  Object.entries(headers)
    .map(([key, value]) => [key.trim(), value] as [string, string])
    .filter(([key]) => Boolean(key));

const safeUrlParts = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    return { path: `${parsed.pathname}${parsed.search}`, host: parsed.host };
  } catch {
    return { path: rawUrl || "/", host: "" };
  }
};

const methodLabel = (method: string) => method.trim().toUpperCase();

const fallbackGenerator = (label: string) => (request: CodeGeneratorRequest) =>
  `// ${label} generator is not implemented yet.\n// ${request.method} ${request.url}`;

const generateNodeAxios = (request: CodeGeneratorRequest) => {
  const method = methodLabel(request.method);
  const headers = normalizeHeaders(request.headers);
  const parsedJson = tryParseJson(request.body);
  const payload = parsedJson ? JSON.stringify(parsedJson, null, 2) : request.body?.trim() ?? "";
  return [
    "const axios = require('axios');",
    "",
    "await axios({",
    `  method: '${method}',`,
    `  url: '${request.url}',`,
    `  headers: ${buildHeaderObject(headers)},`,
    payload ? `  data: ${payload}` : undefined,
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateCurl = (request: CodeGeneratorRequest) => {
  const method = methodLabel(request.method);
  const headers = normalizeHeaders(request.headers);
  const parsedJson = tryParseJson(request.body);
  const body = parsedJson ? JSON.stringify(parsedJson) : request.body?.trim();
  const headerLines = headers.map(([key, value]) => `  -H "${key}: ${value}"`).join(" \\\n");
  const payload = body ? `  -d '${body.replace(/'/g, "'\\''")}'` : undefined;
  return `curl -X ${method} "${request.url}"${headerLines ? ` \\
${headerLines}` : ""}${payload ? ` \\
${payload}` : ""}`;
};

const generateRawHttp = (request: CodeGeneratorRequest) => {
  const method = methodLabel(request.method);
  const { path, host } = safeUrlParts(request.url);
  const headers = normalizeHeaders(request.headers).map(([key, value]) => `${key}: ${value}`);
  const body = request.body?.trim() ?? "";
  return [
    `${method} ${path} HTTP/1.1`,
    host ? `Host: ${host}` : undefined,
    ...headers,
    body ? "" : undefined,
    body || undefined,
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePythonRequests = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const parsedJson = tryParseJson(request.body);
  const payload = parsedJson
    ? JSON.stringify(parsedJson, null, 2)
    : request.body?.trim() ?? undefined;
  return [
    "import requests",
    "",
    "response = requests.post(",
    `    "${request.url}",`,
    headers.length ? `    headers=${buildHeaderDictionary(headers)},` : undefined,
    payload ? `    json=${payload}` : undefined,
    ")",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateGoHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = request.body?.trim() ?? "";
  return [
    "client := &http.Client{}",
    "",
    `req, _ := http.NewRequest("${methodLabel(request.method)}", "${request.url}", bytes.NewBuffer([]byte(${JSON.stringify(body)})))`,
    ...headers.map(([key, value]) => `req.Header.Set("${key}", "${value}")`),
    "",
    "resp, _ := client.Do(req)",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateDartDio = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const parsedJson = tryParseJson(request.body);
  const bodyValue = parsedJson ? JSON.stringify(parsedJson, null, 2) : request.body?.trim();
  return [
    "import 'package:dio/dio.dart';",
    "",
    "final dio = Dio();",
    "",
    "await dio.request(",
    `  '${request.url}',`,
    `  options: Options(method: '${methodLabel(request.method)}', headers: ${buildHeaderDictionary(headers)}),`,
    bodyValue ? `  data: ${bodyValue},` : undefined,
    ");",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateJsFetch = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const parsedJson = tryParseJson(request.body);
  const payload = parsedJson ? JSON.stringify(parsedJson, null, 2) : request.body?.trim();
  return [
    "await fetch('" + request.url + "', {",
    `  method: '${methodLabel(request.method)}',`,
    `  headers: ${buildHeaderObject(headers)},`,
    payload ? `  body: ${payload},` : undefined,
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generators: Record<string, (request: CodeGeneratorRequest) => string> = {
  "node-axios": generateNodeAxios,
  curl: generateCurl,
  "raw-http": generateRawHttp,
  "python-requests": generatePythonRequests,
  "go-http": generateGoHttp,
  "dart-dio": generateDartDio,
  "js-fetch": generateJsFetch,
  "dart-http": fallbackGenerator("Dart HTTP"),
  "csharp-httpclient": fallbackGenerator("C# HttpClient"),
  "csharp-restsharp": fallbackGenerator("C# RestSharp"),
  "java-okhttp": fallbackGenerator("Java OkHttp"),
  "java-unirest": fallbackGenerator("Java Unirest"),
  "js-jquery": fallbackGenerator("JavaScript jQuery"),
  "js-xhr": fallbackGenerator("JavaScript XHR"),
  "kotlin-okhttp": fallbackGenerator("Kotlin OkHttp"),
  "c-libcurl": fallbackGenerator("C LibCurl"),
  "node-native": fallbackGenerator("NodeJS Native"),
  "node-request": fallbackGenerator("NodeJS Request"),
  "node-unirest": fallbackGenerator("NodeJS Unirest"),
  "objc-nsurlsession": fallbackGenerator("Objective-C NSURLSession"),
  "ocaml-cohttp": fallbackGenerator("OCaml Cohttp"),
  "php-curl": fallbackGenerator("PHP cURL"),
  "php-guzzle": fallbackGenerator("PHP Guzzle"),
  "php-http-request2": fallbackGenerator("PHP Http_Request2"),
  "php-pecl-http": fallbackGenerator("PHP pecl_http"),
  "postman-cli": fallbackGenerator("Postman CLI"),
  "powershell-invoke-restmethod": fallbackGenerator("PowerShell Invoke-RestMethod"),
  "python-http-client": fallbackGenerator("Python http.client"),
  "r-httr": fallbackGenerator("R httr"),
  "r-rcurl": fallbackGenerator("R RCurl"),
  "ruby-net-http": fallbackGenerator("Ruby Net::HTTP"),
  "rust-reqwest": fallbackGenerator("Rust reqwest"),
  "shell-httpie": fallbackGenerator("Shell HTTPie"),
  "shell-wget": fallbackGenerator("Shell wget"),
  "swift-urlsession": fallbackGenerator("Swift URLSession"),
};

export const languageGroups = OPTIONS;
export const defaultCodeOption =
  languageGroups.find((group) => group.language === "NodeJS")?.options[0] ??
  languageGroups[0].options[0];

export const generateCode = (request: CodeGeneratorRequest, option: CodeOption) => {
  if (!request.url.trim() || !request.method.trim()) {
    return "// Request is incomplete";
  }
  const generator = generators[option.id];
  if (!generator) {
    return `// No generator for ${option.language} ${option.framework}`;
  }
  return generator(request);
};
