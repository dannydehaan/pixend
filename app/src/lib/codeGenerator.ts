import type { QueryParam } from "../components/api-client/types";

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
      { id: "php-laravel", language: "PHP", framework: "Laravel HTTP Client" },
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

const safeUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const normalizeHeaders = (headers: Record<string, string>) =>
  Object.entries(headers)
    .map(([key, value]) => [key.trim(), value] as [string, string])
    .filter(([key]) => Boolean(key));

const methodLabel = (method: string) => method.trim().toUpperCase();

const rubyHttpClass = (method: string) => {
  const normalized = methodLabel(method);
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

const jsonBody = (request: CodeGeneratorRequest) => {
  const parsed = tryParseJson(request.body);
  if (parsed !== undefined) {
    return JSON.stringify(parsed, null, 2);
  }
  if (request.body?.trim()) {
    return request.body.trim();
  }
  return undefined;
};

const headerObject = (entries: [string, string][]) =>
  entries.length === 0
    ? "{}"
    : `{
${entries.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n")}
}`;

const phpHeaderArray = (entries: [string, string][]) => {
  if (!entries.length) return "[]";
  const rendered = entries.map(([key, value]) => `    '${key}' => '${value.replace(/'/g, "\\'")}'`);
  return `[\n${rendered.join(",\n")}\n]`;
};

const curlHeaders = (entries: [string, string][]) =>
  entries.map(([key, value]) => `  -H "${key}: ${value}"`).join(" \\\n");

const singleQuote = (value: string) => `'` + value.replace(/'/g, "'\\''") + `'`;

const generateNodeAxios = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    "const axios = require('axios');",
    "",
    "await axios({",
    `  method: '${methodLabel(request.method)}',`,
    `  url: '${request.url}',`,
    `  headers: ${headerObject(entries)},`,
    jsonBody(request) ? `  data: ${jsonBody(request)}` : undefined,
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateCurl = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  const splits = [
    `curl -X ${methodLabel(request.method)} "${request.url}"`,
    entries.length ? ` \\
${curlHeaders(entries)}` : undefined,
    body ? ` \\
  -d ${singleQuote(body)}` : undefined,
  ];
  return splits.filter(Boolean).join("");
};

const generateRawHttp = (request: CodeGeneratorRequest) => {
  const parsed = safeUrl(request.url);
  const path = parsed ? `${parsed.pathname}${parsed.search}` : request.url;
  const host = parsed?.host ?? "";
  const entries = normalizeHeaders(request.headers).map(([key, value]) => `${key}: ${value}`);
  const body = request.body?.trim();
  return [
    `${methodLabel(request.method)} ${path} HTTP/1.1`,
    host ? `Host: ${host}` : undefined,
    ...entries,
    body ? "" : undefined,
    body || undefined,
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePythonRequests = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "import requests",
    "",
    "response = requests.post(",
    `    "${request.url}",`,
    headers.length ? `    headers=${headerObject(headers)},` : undefined,
    jsonBody(request) ? `    json=${jsonBody(request)}` : undefined,
    ")",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateDartDio = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "import 'package:dio/dio.dart';",
    "",
    "final dio = Dio();",
    "",
    "await dio.request(",
    `  '${request.url}',`,
    `  options: Options(method: '${methodLabel(request.method)}', headers: ${headerObject(headers)}),`,
    jsonBody(request) ? `  data: ${jsonBody(request)},` : undefined,
    ");",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateGoHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request) ?? "";
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

const generateJsFetch = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    `await fetch('${request.url}', {`,
    `  method: '${methodLabel(request.method)}',`,
    `  headers: ${headerObject(headers)},`,
    jsonBody(request) ? `  body: ${jsonBody(request)},` : undefined,
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateDartHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "import 'package:http/http.dart' as http;",
    "import 'dart:convert';",
    "",
    `final uri = Uri.parse('${request.url}');`,
    "final response = await http.post(",
    "  uri,",
    headers.length ? `  headers: ${headerObject(headers)},` : undefined,
    jsonBody(request) ? `  body: jsonEncode(${jsonBody(request)}),` : undefined,
    ");",
  ]
    .filter(Boolean)
    .join("\n");
};

const headerAssignments = (entries: [string, string][], assignment: (key: string, value: string) => string) =>
  entries.map(([key, value]) => assignment(key, value)).join("\n");

const generateCSharpHttpClient = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    "using System.Net.Http;",
    "using System.Text;",
    "",
    "var client = new HttpClient();",
    "var httpRequest = new HttpRequestMessage();",
    `httpRequest.Method = HttpMethod.${methodLabel(request.method).charAt(0)}${methodLabel(request.method).slice(1).toLowerCase()};`,
    `httpRequest.RequestUri = new Uri("${request.url}");`,
    entries.length ? headerAssignments(entries, (key, value) => `httpRequest.Headers.Add("${key}", "${value}");`) : undefined,
    jsonBody(request)
      ? `httpRequest.Content = new StringContent(${JSON.stringify(jsonBody(request))}, Encoding.UTF8, "application/json");`
      : undefined,
    "var response = await client.SendAsync(httpRequest);",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateCSharpRestSharp = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    "var client = new RestClient();",
    `var request = new RestRequest("${request.url}", Method.${methodLabel(request.method)});`,
    entries.length ? headerAssignments(entries, (key, value) => `request.AddHeader("${key}", "${value}");`) : undefined,
    jsonBody(request) ? `request.AddStringBody(${JSON.stringify(jsonBody(request))}, DataFormat.Json);` : undefined,
    "var response = await client.ExecuteAsync(request);",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateJavaOkHttp = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  const body = jsonBody(request) ?? "";
  return [
    "OkHttpClient client = new OkHttpClient();",
    `RequestBody body = RequestBody.create(body, MediaType.parse("application/json; charset=utf-8"));`,
    "Request request = new Request.Builder()",
    `  .url("${request.url}")`,
    `  .method("${methodLabel(request.method)}", body)`,
    entries.length ? `${entries.map(([key, value]) => `  .addHeader("${key}", "${value}")`).join("\n")}` : undefined,
    "  .build();",
    "Response response = client.newCall(request).execute();",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateJavaUnirest = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    `HttpResponse<String> response = Unirest.post("${request.url}")`,
    entries.length ? entries.map(([key, value]) => `  .header("${key}", "${value}")`).join("\n") : undefined,
    jsonBody(request) ? `  .body(${JSON.stringify(jsonBody(request))})` : undefined,
    "  .asString();",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateJsJQuery = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    "$.ajax({",
    `  url: '${request.url}',`,
    `  method: '${methodLabel(request.method)}',`,
    entries.length ? `  headers: ${headerObject(entries)},` : undefined,
    jsonBody(request) ? `  data: ${jsonBody(request)},` : undefined,
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateJsXhr = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  return [
    "const xhr = new XMLHttpRequest();",
    `xhr.open('${methodLabel(request.method)}', '${request.url}');`,
    entries.length ? entries.map(([key, value]) => `xhr.setRequestHeader('${key}', '${value}');`).join("\n") : undefined,
    jsonBody(request) ? `xhr.send(${jsonBody(request)});` : "xhr.send();",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateKotlinOkHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request) ?? "";
  return [
    "val client = OkHttpClient()",
    `val requestBody = RequestBody.create(\"application/json; charset=utf-8\", ${JSON.stringify(body)})`,
    "val request = Request.Builder()",
    `  .url("${request.url}")`,
    `  .method("${methodLabel(request.method)}", requestBody)`,
    headers.length ? headers.map(([key, value]) => `  .addHeader("${key}", "${value}")`).join("\n") : undefined,
    "  .build()",
    "val response = client.newCall(request).execute()",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateCLibCurl = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    "#include <curl/curl.h>",
    "",
    "CURL* curl = curl_easy_init();",
    "if (curl) {",
    `  curl_easy_setopt(curl, CURLOPT_URL, "${request.url}");`,
    `  curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${methodLabel(request.method)}");`,
    body ? `  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, ${singleQuote(body)});` : undefined,
    headers.length
      ? headers
          .map(([key, value]) => `  struct curl_slist* headers = NULL;\n  headers = curl_slist_append(headers, "${key}: ${value}");`)
          .join("\n")
      : undefined,
    "  CURLcode res = curl_easy_perform(curl);",
    "  curl_easy_cleanup(curl);",
    "}",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateNodeNative = (request: CodeGeneratorRequest) => {
  const parsed = safeUrl(request.url);
  const module = parsed?.protocol === "https:" ? "https" : "http";
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    `const ${module} = require('${module}');`,
    `const req = ${module}.request('${request.url}', {`,
    `  method: '${methodLabel(request.method)}',`,
    headers.length ? `  headers: ${headerObject(headers)},` : undefined,
    `}, (res) => {`,
    "  res.on('data', () => {});",
    "});",
    body ? `req.write(${body});` : undefined,
    "req.end();",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateNodeRequest = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    "const request = require('request');",
    "",
    "request({",
    `  url: '${request.url}',`,
    `  method: '${methodLabel(request.method)}',`,
    headers.length ? `  headers: ${headerObject(headers)},` : undefined,
    body ? `  body: ${body},` : undefined,
    "}, (error, response, body) => {",
    "  console.log(response && response.body);",
    "});",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateNodeUnirest = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "const unirest = require('unirest');",
    "",
    `unirest.${methodLabel(request.method).toLowerCase()}('${request.url}')`,
    headers.length ? headers.map(([key, value]) => `  .headers({ '${key}': '${value}' })`).join("\n") : undefined,
    jsonBody(request) ? `  .send(${jsonBody(request)})` : undefined,
    "  .end((res) => console.log(res.body));",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateObjectiveCNSURLSession = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    `NSURL *url = [NSURL URLWithString:@"${request.url}"];`,
    "NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];",
    `request.HTTPMethod = @\"${methodLabel(request.method)}\";`,
    headers.length ? headers.map(([key, value]) => `request.addValue:@\"${value}\" forHTTPHeaderField:@\"${key}\";`).join("\n") : undefined,
    jsonBody(request) ? `request.HTTPBody = [@\"${jsonBody(request)}\" dataUsingEncoding:NSUTF8StringEncoding];` : undefined,
    "NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {",
    "  // Handle response",
    "}];",
    "[task resume];",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateOCamlCohttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    `let uri = Uri.of_string "${request.url}" in`,
    "let headers = Cohttp.Header.of_list [",
    headers.length ? headers.map(([key, value]) => `  (\"${key}\", \"${value}\")`).join(";\n") : undefined,
    "] in",
    `Cohttp_lwt_unix.Client.${methodLabel(request.method).toLowerCase()} ~headers ~body:(Cohttp_lwt.Body.of_string \"${jsonBody(request) ?? ""}\") uri`,
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePhpCurl = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    "$curl = curl_init();",
    `curl_setopt($curl, CURLOPT_URL, "${request.url}");`,
    `curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "${methodLabel(request.method)}");`,
    body ? `curl_setopt($curl, CURLOPT_POSTFIELDS, ${singleQuote(body)});` : undefined,
    headers.length
      ? `curl_setopt($curl, CURLOPT_HTTPHEADER, [${headers.map(([key, value]) => `"${key}: ${value}"`).join(", ")}]);`
      : undefined,
    "$response = curl_exec($curl);",
    "curl_close($curl);",
  ]
    .filter(Boolean)
    .join("\n");
};

const formatPhpArray = (value: unknown, depth = 0): string => {
  const indent = "    ".repeat(depth);
  const nextIndent = "    ".repeat(depth + 1);

  if (value === null) return "null";
  if (typeof value === "string") return `'${value.replace(/'/g, "\\'")}'`;
  if (typeof value === "number" || typeof value === "boolean") return `${value}`;
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    const rendered = value.map((entry) => `${nextIndent}${formatPhpArray(entry, depth + 1)}`);
    return `[\n${rendered.join(",\n")}\n${indent}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "[]";
    const rendered = entries.map(
      ([key, entry]) => `${nextIndent}'${key}' => ${formatPhpArray(entry, depth + 1)}`,
    );
    return `[\n${rendered.join(",\n")}\n${indent}]`;
  }
  return `'${String(value).replace(/'/g, "\\'")}'`;
};

const generatePhpLaravel = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  const tokenIndex = entries.findIndex(([key]) => key.toLowerCase() === "authorization");
  const tokenHeader = tokenIndex !== -1 ? entries[tokenIndex] : undefined;
  const filteredHeaders = entries.filter((_, idx) => idx !== tokenIndex);
  const parsedBody = tryParseJson(request.body);
  const rawBody = request.body?.trim();
  const method = methodLabel(request.method);

  const modifiers: string[] = [];
  if (tokenHeader) {
    const [, value] = tokenHeader;
    const token = value.replace(/^Bearer\s+/i, "");
    modifiers.push(`withToken('${token}')`);
  } else if (filteredHeaders.length) {
    modifiers.push(`withHeaders(${phpHeaderArray(filteredHeaders)})`);
  }

  if (!parsedBody && rawBody) {
    modifiers.push(`withBody(${singleQuote(rawBody)}, 'application/json')`);
  }

  const hasModifiers = modifiers.length > 0;
  const prefix = hasModifiers ? `Http::${modifiers.join("->")}` : "Http";
  const connector = hasModifiers ? "->" : "::";
  let requestLine = `${prefix}${connector}${method.toLowerCase()}('${request.url}'`;
  if (parsedBody) {
    requestLine += `, ${formatPhpArray(parsedBody)}`;
  }
  requestLine += ");";

  return [
    "use Illuminate\\Support\\Facades\\Http;",
    "",
    `$response = ${requestLine}`,
    "",
    "$data = $response->json();",
  ].join("\n");
};

const generatePhpGuzzle = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "$client = new \GuzzleHttp\Client();",
    "",
    `$response = $client->request('${methodLabel(request.method)}', '${request.url}', [`,
    headers.length ? `  'headers' => ${headerObject(headers)},` : undefined,
    jsonBody(request) ? `  'json' => ${jsonBody(request)},` : undefined,
    "]);",
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePhpHttpRequest2 = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    `$request = new http\\Client\\Request('${methodLabel(request.method)}', '${request.url}');`,
    headers.length ? `foreach (${headers.map(([key, value]) => `['${key}'] => '${value}'`).join(" , ")} as $name => $value) {` : undefined,
    "    $request->setHeader($name, $value);",
    headers.length ? "}" : undefined,
    body ? `$request->setBody(${singleQuote(body)});` : undefined,
    "$client = new http\\Client();",
    "$response = $client->send($request);",
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePhpPeclHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    "$client = new http\\Client();",
    `$client->setOptions(["http" => ["method" => '${methodLabel(request.method)}']]);`,
    headers.length ? headers.map(([key, value]) => `$client->setHeaders(['${key}' => '${value}']);`).join("\n") : undefined,
    body ? `$client->setBody(${singleQuote(body)});` : undefined,
    `$client->send('${request.url}');`,
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePostmanCLI = (request: CodeGeneratorRequest) => {
  return `postman request --method ${methodLabel(request.method)} --url ${request.url}`;
};

const generatePowerShell = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "$headers = @{",
    headers.length ? headers.map(([key, value]) => `  '${key}' = '${value}'`).join("\n") : undefined,
    "}",
    `Invoke-RestMethod -Method ${methodLabel(request.method)} -Uri '${request.url}' -Headers $headers ${jsonBody(request) ? `-Body '${jsonBody(request)}'` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const generatePythonHttpClient = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "import http.client",
    "import json",
    "",
    "conn = http.client.HTTPSConnection('example.com')",
    "",
    `payload = ${jsonBody(request) || "''"}`,
    "headers = {",
    headers.length ? headers.map(([key, value]) => `  '${key}': '${value}',`).join("\n") : undefined,
    "}",
    `conn.request('${methodLabel(request.method)}', '${request.url}', payload, headers)`,
    "res = conn.getresponse()",
    "data = res.read()",
    "print(data.decode('utf-8'))",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateRhttr = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "library(httr)",
    "",
    `response <- VERB("${methodLabel(request.method)}", "${request.url}",`,
    headers.length ? `  add_headers(.headers = ${headerObject(headers)}),` : undefined,
    jsonBody(request) ? `  body = ${jsonBody(request)},` : undefined,
    "  encode = \"json\")",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateRrcurl = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  return [
    "library(RCurl)",
    "",
    "handle <- getCurlHandle()",
    headers.length
      ? headers.map(([key, value]) => `curlSetOpt(.opts = list(${key} = ${singleQuote(value)}), curl = handle)`).join("\n")
      : undefined,
    body ? `curlSetOpt(.opts = list(postfields = ${singleQuote(body)}), curl = handle)` : undefined,
    `response <- curlPerform(url = '${request.url}', customrequest = '${methodLabel(request.method)}', curl = handle)` ,
  ]
    .filter(Boolean)
    .join("\n");
};

const generateRubyNetHttp = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "require 'net/http'",
    "require 'uri'",
    "",
    `uri = URI('${request.url}')`,
    `req = Net::HTTP::${rubyHttpClass(request.method)}.new(uri)`,
    headers.length ? headers.map(([key, value]) => `req["${key}"] = "${value}"`).join("\n") : undefined,
    jsonBody(request) ? `req.body = ${jsonBody(request)}` : undefined,
    "res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|",
    "  http.request(req)",
    "end",
  ]
    .filter(Boolean)
    .join("\n");
};

const generateRustReqwest = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "use reqwest::Client;",
    "",
    "let client = Client::new();",
    "",
    "let response = client",
    `    .${methodLabel(request.method).toLowerCase()}("${request.url}")`,
    headers.length ? headers.map(([key, value]) => `    .header("${key}", "${value}")`).join("\n") : undefined,
    jsonBody(request) ? `    .body(${jsonBody(request)})` : undefined,
    `    .send()
    .await?;`,
  ]
    .filter(Boolean)
    .join("\n");
};

const generateShellHttpie = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  const headerSegments = entries.map(([key, value]) => `'${key}:${value}'`).join(" ");
  return `http ${methodLabel(request.method).toLowerCase()} ${request.url}${headerSegments ? ` ${headerSegments}` : ""}${body ? ` '${body}'` : ""}`;
};

const generateShellWget = (request: CodeGeneratorRequest) => {
  const entries = normalizeHeaders(request.headers);
  const body = jsonBody(request);
  const headerSegments = entries.map(([key, value]) => `--header='${key}: ${value}'`).join(" ");
  return `wget --method=${methodLabel(request.method)} ${headerSegments} ${body ? `--body-data=${singleQuote(body)}` : ""} '${request.url}'`;
};

const generateSwiftUrlSession = (request: CodeGeneratorRequest) => {
  const headers = normalizeHeaders(request.headers);
  return [
    "import Foundation",
    "",
    `var request = URLRequest(url: URL(string: \"${request.url}\")!)`,
    `request.httpMethod = \"${methodLabel(request.method)}\"`,
    headers.length ? headers.map(([key, value]) => `request.setValue(\"${value}\", forHTTPHeaderField: \"${key}\")`).join("\n") : undefined,
    jsonBody(request) ? `request.httpBody = \"${jsonBody(request)}\".data(using: .utf8)` : undefined,
    "URLSession.shared.dataTask(with: request) { data, response, error in",
    "  // Handle response",
    "}.resume()",
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
  "dart-http": generateDartHttp,
  "csharp-httpclient": generateCSharpHttpClient,
  "csharp-restsharp": generateCSharpRestSharp,
  "java-okhttp": generateJavaOkHttp,
  "java-unirest": generateJavaUnirest,
  "js-jquery": generateJsJQuery,
  "js-xhr": generateJsXhr,
  "kotlin-okhttp": generateKotlinOkHttp,
  "c-libcurl": generateCLibCurl,
  "node-native": generateNodeNative,
  "node-request": generateNodeRequest,
  "node-unirest": generateNodeUnirest,
  "objc-nsurlsession": generateObjectiveCNSURLSession,
  "ocaml-cohttp": generateOCamlCohttp,
  "php-curl": generatePhpCurl,
  "php-guzzle": generatePhpGuzzle,
  "php-http-request2": generatePhpHttpRequest2,
  "php-pecl-http": generatePhpPeclHttp,
  "php-laravel": generatePhpLaravel,
  "postman-cli": generatePostmanCLI,
  "powershell-invoke-restmethod": generatePowerShell,
  "python-http-client": generatePythonHttpClient,
  "r-httr": generateRhttr,
  "r-rcurl": generateRrcurl,
  "ruby-net-http": generateRubyNetHttp,
  "rust-reqwest": generateRustReqwest,
  "shell-httpie": generateShellHttpie,
  "shell-wget": generateShellWget,
  "swift-urlsession": generateSwiftUrlSession,
};

export const languageGroups = OPTIONS;
export const defaultCodeOption =
  languageGroups.find((group) => group.language === "NodeJS")?.options[0] ?? languageGroups[0].options[0];

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
