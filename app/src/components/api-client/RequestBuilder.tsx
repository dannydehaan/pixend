import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BodyEditor from "./BodyEditor";
import CodeGeneratorPanel from "./CodeGeneratorPanel";
import HeaderList from "./HeaderList";
import QueryParamsEditor from "./QueryParamsEditor";
import ResponseViewer from "./ResponseViewer";
import { TabPanel, Tabs } from "./Tabs";
import { sendRequest, type HttpClientResult } from "../../lib/httpClient";
import type { BodyType, HeaderEntry, HttpMethod, QueryParam, ResponsePayload } from "./types";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type RequestState = {
  method: HttpMethod;
  url: string;
  headers: HeaderEntry[];
  bodyType: BodyType;
  body: string;
  response?: ResponsePayload;
  queryParams: QueryParam[];
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createHeaderEntry = (key = "", value = ""): HeaderEntry => ({
  id: generateId(),
  key,
  value,
});

const createQueryParam = (key = "", value = ""): QueryParam => ({
  id: generateId(),
  key,
  value,
});

const initialUrl = "https://mijn.firstlogistics.test/api/app/1.0/login";

const sanitizeJsonInput = (value: string) =>
  value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

const queryParamsFromJson = (value: string): QueryParam[] => {
  const sanitized = sanitizeJsonInput(value);
  const parsed = JSON.parse(sanitized);
  return Object.entries(parsed).map(([key, entryValue]) =>
    createQueryParam(key, entryValue === undefined || entryValue === null ? "" : String(entryValue)),
  );
};

const buildQueryStringFromParams = (params: QueryParam[]) => {
  const searchParams = new URLSearchParams();
  params.forEach(({ key, value }) => {
    if (key.trim()) {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

const parseQueryParamsFromUrl = (url: string): QueryParam[] | null => {
  try {
    const urlInstance = new URL(url);
    const parsed: QueryParam[] = [];
    urlInstance.searchParams.forEach((value, key) => {
      parsed.push(createQueryParam(key, value));
    });
    return parsed;
  } catch {
    return null;
  }
};

const stripQueryFromUrl = (url: string) => {
  try {
    const urlInstance = new URL(url);
    urlInstance.search = "";
    return urlInstance.toString();
  } catch {
    return url.split("?")[0] || url;
  }
};

const composeUrlWithParams = (url: string, params: QueryParam[]) => {
  const query = buildQueryStringFromParams(params);
  if (!query) {
    return stripQueryFromUrl(url);
  }

  try {
    const urlInstance = new URL(url);
    urlInstance.search = query;
    return urlInstance.toString();
  } catch {
    const base = stripQueryFromUrl(url);
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${base.endsWith("?") ? "" : separator}${query}`;
  }
};

const initialState: RequestState = {
  method: "POST",
  url: initialUrl,
  headers: [createHeaderEntry("Content-Type", "application/json")],
  bodyType: "json",
  body: JSON.stringify(
    {
      identifier: "henk12345",
      password: "henk12345",
    },
    null,
    2,
  ),
  queryParams: parseQueryParamsFromUrl(initialUrl) ?? [],
};

const RequestBuilder = () => {
  const [requestState, setRequestState] = useState<RequestState>(initialState);
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("headers");
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const showBodyEditor = useMemo(
    () => ["POST", "PUT", "PATCH"].includes(requestState.method),
    [requestState.method],
  );

  const sanitizedJsonBody = useMemo(
    () => (requestState.bodyType === "json" ? sanitizeJsonInput(requestState.body) : requestState.body),
    [requestState.body, requestState.bodyType],
  );

  const headersObject = useMemo(() =>
    requestState.headers.reduce<Record<string, string>>((acc, header) => {
      const key = header.key.trim();
      if (key) {
        acc[key] = header.value;
      }
      return acc;
    }, {}),
    [requestState.headers],
  );

  const finalUrl = useMemo(
    () => composeUrlWithParams(requestState.url, requestState.queryParams),
    [requestState.url, requestState.queryParams],
  );

  const codeRequestPayload = useMemo(() => {
    const sanitizedBodyForCode =
      requestState.method === "GET" ? undefined : requestState.bodyType === "json" ? sanitizedJsonBody : undefined;
    return {
      method: requestState.method,
      url: finalUrl,
      headers: headersObject,
      queryParams: requestState.queryParams,
      body: sanitizedBodyForCode,
    };
  }, [requestState.method, requestState.bodyType, requestState.queryParams, finalUrl, headersObject, sanitizedJsonBody]);

  const handleMethodChange = (newMethod: HttpMethod) => {
    setRequestState((prev) => {
      let nextUrl = prev.url;
      let nextQueryParams = prev.queryParams;
      if (newMethod === "GET" && prev.bodyType === "json") {
        try {
          const generatedParams = queryParamsFromJson(prev.body);
          nextQueryParams = generatedParams;
          nextUrl = composeUrlWithParams(prev.url, generatedParams);
        } catch {
          // invalid JSON, leave existing params untouched
        }
      }
      return { ...prev, method: newMethod, url: nextUrl, queryParams: nextQueryParams };
    });
  };

  const handleUrlChange = (value: string) => {
    const parsed = parseQueryParamsFromUrl(value);
    setRequestState((prev) => ({
      ...prev,
      url: value,
      queryParams: parsed ?? prev.queryParams,
    }));
  };

  const updateQueryParams = (updater: (current: QueryParam[]) => QueryParam[]) => {
    setRequestState((prev) => {
      const nextParams = updater(prev.queryParams);
      return {
        ...prev,
        queryParams: nextParams,
        url: composeUrlWithParams(prev.url, nextParams),
      };
    });
  };

  const handleAddQueryParam = () => updateQueryParams((current) => [...current, createQueryParam()]);

  const handleQueryParamChange = (id: string, field: keyof Omit<QueryParam, "id">, value: string) =>
    updateQueryParams((current) => current.map((param) => (param.id === id ? { ...param, [field]: value } : param)));

  const handleRemoveQueryParam = (id: string) => updateQueryParams((current) => current.filter((param) => param.id !== id));

  const handleSend = async () => {
    if (!requestState.url.trim()) {
      setValidationError("Please specify a request URL.");
      return;
    }

    let sanitizedBody = requestState.body;
    if (requestState.bodyType === "json") {
      sanitizedBody = sanitizedJsonBody;
      try {
        if (sanitizedBody.trim()) {
          JSON.parse(sanitizedBody);
        }
        setJsonError(null);
      } catch (error) {
        setJsonError(error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON payload.");
        return;
      }
    } else {
      setJsonError(null);
    }

    setValidationError(null);
    setSendError(null);

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setIsSending(true);

    try {
      const actualBodyType = requestState.method === "GET" ? "none" : requestState.bodyType;
      const result: HttpClientResult = await sendRequest({
        url: finalUrl,
        method: requestState.method,
        headers: headersObject,
        bodyType: actualBodyType,
        body: actualBodyType === "json" ? sanitizedBody : undefined,
        signal: controller.signal,
      });

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (result.error) {
        setIsSending(false);
        setSendError(result.error.message);
        setRequestState((prev) => ({ ...prev, response: undefined }));
        controllerRef.current = null;
        return;
      }

      if (!result.response) {
        setIsSending(false);
        setSendError("Request cancelled");
        setRequestState((prev) => ({ ...prev, response: undefined }));
        controllerRef.current = null;
        return;
      }

      const response = result.response!;
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();

      setRequestState((prev) => ({
        ...prev,
        response: {
          status: response.status,
          headers: responseHeaders,
          body: responseBody,
          duration: result.duration,
        },
      }));
      controllerRef.current = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to execute request.";
      setSendError(message);
      setRequestState((prev) => ({ ...prev, response: undefined }));
      controllerRef.current = null;
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setIsSending(false);
      setSendError("Request cancelled");
    }
  };

  const handleHeaderFieldChange = (
    id: string,
    field: keyof Omit<HeaderEntry, "id">,
    value: string,
  ) => {
    setRequestState((prev) => ({
      ...prev,
      headers: prev.headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header,
      ),
    }));
  };

  const handleAddHeader = () => {
    setRequestState((prev) => ({
      ...prev,
      headers: [...prev.headers, createHeaderEntry()],
    }));
  };

  const handleRemoveHeader = (id: string) => {
    setRequestState((prev) => {
      const filtered = prev.headers.filter((header) => header.id !== id);
      return { ...prev, headers: filtered.length ? filtered : [createHeaderEntry()] };
    });
  };

  const tabDefinitions = [
    { id: "headers", label: "Headers" },
    { id: "body", label: "Body" },
    { id: "params", label: "Query Params" },
  ];

  return (
    <div className="space-y-6 relative">
      <section
        className="grid gap-4 rounded-2xl border p-6"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="sr-only" htmlFor="http-method">
            HTTP method
          </label>
          <select
            id="http-method"
            className="rounded-lg border border-outline-variant/50 bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-[0.4em] text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            value={requestState.method}
            onChange={(event) => handleMethodChange(event.target.value as HttpMethod)}
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="request-url">
            Request URL
          </label>
          <input
            id="request-url"
            className="flex-1 rounded-lg border border-outline-variant/30 bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            placeholder="https://api.example.com/..."
            value={requestState.url}
            onChange={(event) => handleUrlChange(event.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="send-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSend}
            disabled={isSending}
          >
            <span className="material-symbols-outlined text-sm" aria-hidden>
              send
            </span>
            <span>{isSending ? "Sending" : "Send"}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)] hover:border-outline-variant"
            onClick={() => setIsCodePanelOpen(true)}
          >
            <span className="material-symbols-outlined text-sm" aria-hidden>
              code
            </span>
            <span>Code</span>
          </button>
          {isSending && (
            <button
              type="button"
              className="ml-2 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-xs uppercase tracking-[0.3em] text-error hover:border-error/80"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
        {validationError && <p className="text-xs text-error font-semibold">{validationError}</p>}
        <p className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant">
          Tip: Use API keys in headers, keep requests in sync, and experiment freely.
        </p>
      </section>

      <div className="space-y-2">
        <Tabs tabs={tabDefinitions} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="space-y-4">
          <TabPanel tabId="headers" activeTab={activeTab}>
            <HeaderList
              headers={requestState.headers}
              onAdd={handleAddHeader}
              onRemove={handleRemoveHeader}
              onChange={handleHeaderFieldChange}
            />
          </TabPanel>
          <TabPanel tabId="body" activeTab={activeTab}>
            {requestState.method === "GET" ? (
            <section
              className="rounded-2xl border p-6 text-xs text-[var(--muted)]"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
                GET requests do not support a body. JSON data will be serialized as query parameters.
              </section>
            ) : showBodyEditor ? (
              <BodyEditor
                bodyType={requestState.bodyType}
                body={requestState.body}
                onBodyChange={(body) => setRequestState((prev) => ({ ...prev, body }))}
                onBodyTypeChange={(bodyType) => setRequestState((prev) => ({ ...prev, bodyType }))}
                validationError={jsonError}
                onSendRequest={handleSend}
              />
            ) : (
            <section
              className="rounded-2xl border p-6 text-xs text-[var(--muted)]"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
                Body payload is only available for POST, PUT, or PATCH methods.
              </section>
            )}
          </TabPanel>
          <TabPanel tabId="params" activeTab={activeTab}>
            <QueryParamsEditor
              params={requestState.queryParams}
              onAdd={handleAddQueryParam}
              onChangeRow={handleQueryParamChange}
              onRemove={handleRemoveQueryParam}
            />
          </TabPanel>
        </div>
      </div>

      <ResponseViewer response={requestState.response} isLoading={isSending} errorMessage={sendError} />
      <CodeGeneratorPanel isOpen={isCodePanelOpen} onClose={() => setIsCodePanelOpen(false)} request={codeRequestPayload} />

    </div>
  );
};

export default RequestBuilder;
