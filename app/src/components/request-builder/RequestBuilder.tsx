import { useEffect, useMemo, useRef, useState } from "react";
import MethodSelector from "./MethodSelector";
import RequestTabs, { type TabOption } from "./RequestTabs";
import UrlInput from "./UrlInput";
import { collectMissingVariables, resolveVariablesRecursive } from "../../utils/resolveVariables";
import { resolveFaker } from "../../utils/fakerResolver";
import { EnvironmentPayload, loadEnvironments, saveEnvironment } from "../../services/environmentService";
import { useAuth } from "../../contexts/AuthContext";
import {
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  subscribeActiveEnvironmentId,
} from "../../services/environmentSelection";

const defaultMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const FAKER_VARIABLES = [
  "$guid",
  "$randomUUID",
  "$timestamp",
  "$isoTimestamp",
  "$randomEmail",
  "$randomUserName",
  "$randomPassword",
  "$randomIP",
  "$randomIPV6",
  "$randomMACAddress",
  "$randomUserAgent",
  "$randomProtocol",
  "$randomFirstName",
  "$randomLastName",
  "$randomFullName",
  "$randomPhoneNumber",
  "$randomCity",
  "$randomStreetAddress",
  "$randomCountry",
  "$randomLatitude",
  "$randomLongitude",
  "$randomCompanyName",
  "$randomJobTitle",
  "$randomWord",
  "$randomSentence",
  "$randomParagraph",
  "$randomBoolean",
  "$randomInt",
  "$randomFloat",
  "$randomHexColor",
  "$randomColor",
  "$randomPrice",
  "$randomProductName",
  "$randomDepartment",
];

type VariableEntry = {
  id: string;
  key: string;
  value: string;
};

const generateVariableId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const RequestBuilder = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>("GET");
  const [endpoint, setEndpoint] = useState<string>("https://api.pixend.io/v1/users/profile");
  const [activeTab, setActiveTab] = useState<TabOption>("Params");
  const [requestBody] = useState<string>("{ \"example\": \"payload\" }");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseText, setResponseText] = useState<string>("");
  const [environmentEntries, setEnvironmentEntries] = useState<VariableEntry[]>([
    { id: "base-url", key: "baseUrl", value: "https://api.pixend.io/v1" },
    { id: "token", key: "token", value: "abc123" },
  ]);
  const [missingVariables, setMissingVariables] = useState<string[]>([]);
  const [environmentId, setEnvironmentId] = useState<string>("default-env");
  const [environmentName, setEnvironmentName] = useState<string>("Local Environment");
  const [environmentHydrated, setEnvironmentHydrated] = useState(false);
  const [availableEnvironments, setAvailableEnvironments] = useState<EnvironmentPayload[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(() => getActiveEnvironmentId());
  const { encryptionKey, isAuthenticated } = useAuth();
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeActiveEnvironmentId((value) => {
      setSelectedEnvironmentId(value);
    });
    return unsubscribe;
  }, []);

  const environmentVariables = useMemo(() => {
    return environmentEntries.reduce<Record<string, string>>((acc, entry) => {
      const key = entry.key.trim();
      if (!key) {
        return acc;
      }
      acc[key] = entry.value;
      return acc;
    }, {});
  }, [environmentEntries]);

  const resolveWithEnvironment = (value: string) =>
    resolveVariablesRecursive(resolveFaker(value), environmentVariables);

  const hydrateEntriesFromRecord = (variables: Record<string, string>) => {
    const entries = Object.entries(variables).map(([key, value]) => ({
      id: generateVariableId(),
      key,
      value,
    }));
    if (entries.length) {
      setEnvironmentEntries(entries);
    }
  };

  useEffect(() => {
    if (!encryptionKey) {
      return;
    }

    let isMounted = true;
    setEnvironmentHydrated(false);

    loadEnvironments(encryptionKey, isAuthenticated)
      .then((records) => {
        if (!isMounted) return;
        setAvailableEnvironments(records);
        const storedId = getActiveEnvironmentId();
        const fallbackId = records[0]?.id ?? null;
        const resolvedId =
          storedId && records.some((env) => env.id === storedId) ? storedId : fallbackId;
        if (resolvedId) {
          setSelectedEnvironmentId(resolvedId);
          setActiveEnvironmentId(resolvedId);
        } else {
          setSelectedEnvironmentId(null);
          setActiveEnvironmentId(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setEnvironmentHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [encryptionKey, isAuthenticated]);

  useEffect(() => {
    if (!environmentHydrated) return;
    const record = availableEnvironments.find((env) => env.id === selectedEnvironmentId) ?? null;
    if (record) {
      setEnvironmentId(record.id);
      setEnvironmentName(record.name);
      hydrateEntriesFromRecord(record.variables);
    } else {
      setEnvironmentEntries([]);
    }
  }, [availableEnvironments, selectedEnvironmentId, environmentHydrated]);

  useEffect(() => {
    if (!encryptionKey || !environmentHydrated || !selectedEnvironmentId) {
      return;
    }

    const handler = setTimeout(() => {
      const variables = environmentEntries.reduce<Record<string, string>>((acc, entry) => {
        const key = entry.key.trim();
        if (key) {
          acc[key] = entry.value;
        }
        return acc;
      }, {});

      saveEnvironment(
        { id: environmentId, name: environmentName, variables },
        encryptionKey,
        isAuthenticated,
      ).catch(() => {
        // swallow errors for now
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [encryptionKey, environmentEntries, environmentHydrated, environmentId, environmentName, isAuthenticated]);

  const handleAddVariable = () => {
    setEnvironmentEntries((prev) => [
      ...prev,
      { id: generateVariableId(), key: "", value: "" },
    ]);
  };

  const updateVariable = (id: string, field: "key" | "value", value: string) => {
    setEnvironmentEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  };

  const removeVariable = (id: string) => {
    setEnvironmentEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const resolveWithEnvironment = (value: string) =>
    resolveVariablesRecursive(resolveFaker(value), environmentVariables);

  const insertAtCursor = (value: string) => {
    setEndpoint((prev) => {
      const input = urlInputRef.current;
      if (!input) {
        return prev + value;
      }
      const start = input.selectionStart ?? prev.length;
      const end = input.selectionEnd ?? prev.length;
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      setTimeout(() => {
        const cursor = start + value.length;
        input.setSelectionRange(cursor, cursor);
        input.focus();
      }, 0);
      return `${before}${value}${after}`;
    });
  };

  const handleSend = async () => {
    try {
      setResponseStatus(null);
      setResponseText("");

      const method = selectedMethod.toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const init: RequestInit = {
        method,
        headers,
      };

      const shouldAttachBody = ["POST", "PUT", "PATCH"].includes(method) || (method === "DELETE" && requestBody.trim());

      if (shouldAttachBody) {
        init.body = requestBody;
      }

      const resolvedUrl = resolveWithEnvironment(endpoint);
      const resolvedHeaders = Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [key, resolveWithEnvironment(value)]),
      );
      const resolvedBody = shouldAttachBody ? resolveWithEnvironment(requestBody) : undefined;

      const missingTracker = new Set<string>();
      const trackMissing = (value?: string) => {
        if (!value) return;
        const fakerResolved = resolveFaker(value);
        collectMissingVariables(fakerResolved, environmentVariables).forEach((key) => missingTracker.add(key));
      };
      trackMissing(endpoint);
      Object.values(headers).forEach(trackMissing);
      if (shouldAttachBody) {
        trackMissing(requestBody);
      }
      setMissingVariables(Array.from(missingTracker));

      const httpResult = await sendRequest({
        url: resolvedUrl,
        method,
        headers: resolvedHeaders,
        body: shouldAttachBody && resolvedBody ? resolvedBody : undefined,
        bodyType: shouldAttachBody ? requestState.bodyType : "none",
      });

      setResponseStatus(httpResult.response?.status ?? null);
      setResponseHeaders(httpResult.response?.headers ?? {});
      setResponseText(httpResult.response?.body ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error";
      setResponseStatus(null);
      setResponseHeaders({});
      setResponseText(message);
    }
  };

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col overflow-hidden">
      <header className="flex justify-between items-center w-full px-6 h-16 backdrop-blur-xl bg-opacity-80 bg-[#0b1326] z-50 shrink-0">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter text-[#e84c1b] uppercase">Pixend</span>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-[#e84c1b] font-bold border-b-2 border-[#e84c1b] pb-1 font-['Inter'] tracking-tight text-sm uppercase" href="#">
              Workspace
            </a>
            <a className="text-[#dae2fd]/60 font-medium hover:bg-[#222a3d] transition-colors duration-200 px-2 py-1 rounded font-['Inter'] tracking-tight text-sm uppercase" href="#">
              Environments
            </a>
            <a className="text-[#dae2fd]/60 font-medium hover:bg-[#222a3d] transition-colors duration-200 px-2 py-1 rounded font-['Inter'] tracking-tight text-sm uppercase" href="#">
              History
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
            <span>Send</span>
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <button className="p-2 hover:bg-[#222a3d] rounded-full transition-all">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="p-2 hover:bg-[#222a3d] rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col h-full w-64 bg-[#131b2e] border-r border-[#494454]/10 shrink-0">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#e84c1b]">Project Alpha</h2>
                <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tighter">Engineering Team</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden">
                <img
                  alt="User Profile"
                  data-alt="User avatar placeholder with dark aesthetic"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG9yrmrFkupr8JmVGPrXpIHiJBFpzm67bF4uv1yxiMlP2NP7gKfnSFzT308tRM0CG3GqFNGz5JA57osDVTO_2jjoFmr0Yd1sdneaTKQqwgnW-IToJvMxbA7E-u-lUD8XVTXkDTJH0c6POAEonuuvJgO40SewB1Uqsq88WeKx8mxRXJ-Bo2pASCV8r1pwrF9-noWhym00v59cXqIy0yJMlozlGDdIrtTJuJwAXngddldfcgpKOtbF6PkiZ5jH-IMl52Et-zxCXtdyOZ"
                />
              </div>
            </div>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-on-surface-variant/40">search</span>
              <input
                className="w-full bg-surface-container-lowest border-none text-xs rounded-lg pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary transition-all"
                placeholder="Search Collections"
                type="text"
              />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-highest text-[#e84c1b] text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>New Collection</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            <div className="bg-[#222a3d] text-[#e84c1b] border-r-2 border-[#e84c1b] flex items-center gap-3 px-3 py-2.5 rounded-l-md transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-lg">folder_open</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Collections</span>
            </div>
            <div className="pl-4 mt-2 space-y-2">
              <details className="group" open>
                <summary className="flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer text-[11px] font-bold uppercase transition-colors">
                  <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-90">chevron_right</span>
                  <span>Auth Service</span>
                </summary>
                <div className="pl-4 mt-1 border-l border-outline-variant/20 space-y-1">
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-secondary transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-secondary/10">POST</span>
                    <span>/login</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-tertiary transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-tertiary/10">GET</span>
                    <span>/session</span>
                  </div>
                </div>
              </details>
              <details className="group" open>
                <summary className="flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer text-[11px] font-bold uppercase transition-colors">
                  <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-90">chevron_right</span>
                  <span>User API</span>
                </summary>
                <div className="pl-4 mt-1 border-l border-outline-variant/20 space-y-1">
                  <div className="flex items-center gap-2 p-1.5 bg-primary/10 rounded text-[10px] mono text-primary transition-all cursor-pointer border-r-2 border-primary">
                    <span className="text-[9px] font-black px-1 rounded bg-primary/20">GET</span>
                    <span>/v1/users/profile</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-error transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-error/10">DEL</span>
                    <span>/account</span>
                  </div>
                </div>
              </details>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer mt-4">
              <span className="material-symbols-outlined text-lg">api</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">APIs</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">cloud_queue</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Environments</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">dns</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Mock Servers</span>
            </div>
          </nav>
          <footer className="p-4 border-t border-[#494454]/10 space-y-1">
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] flex items-center gap-3 px-3 py-2 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">settings</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Settings</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] flex items-center gap-3 px-3 py-2 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">help</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Help</span>
            </div>
          </footer>
        </aside>

        <section className="flex-1 flex flex-col bg-surface min-w-0">
          <div className="flex items-center h-10 bg-surface-container-low px-2 gap-1 border-b border-outline-variant/10 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-4 h-full bg-surface border-t-2 border-primary text-primary text-xs font-medium mono whitespace-nowrap">
              <span className="text-[10px] font-black">GET</span>
              <span>/v1/users/profile</span>
              <span className="material-symbols-outlined text-[14px] hover:bg-surface-container-highest rounded-full p-0.5 cursor-pointer">close</span>
            </div>
            <div className="flex items-center gap-2 px-4 h-full text-on-surface-variant/40 text-xs font-medium mono whitespace-nowrap hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="text-[10px] font-black">POST</span>
              <span>/login</span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">close</span>
            </div>
            <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant/40 ml-2" type="button">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-2 items-stretch">
              <MethodSelector methods={defaultMethods} value={selectedMethod} onChange={setSelectedMethod} />
              <UrlInput
                value={endpoint}
                onChange={setEndpoint}
                datalistId="faker-variables"
                datalistOptions={FAKER_VARIABLES}
                inputRef={urlInputRef}
              />
              <button
                onClick={handleSend}
                className="px-8 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black rounded-lg hover:shadow-[0_0_20px_rgba(208,188,255,0.3)] transition-all active:scale-95"
                type="button"
              >
                SEND
              </button>
            </div>

            <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="flex-1 min-h-0 flex flex-col border-t border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex flex-col gap-2 px-6 py-3 shrink-0">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Response</span>
                <span className="text-[10px] mono text-on-surface-variant/60 font-medium">Status: {responseStatus ?? "pending"}</span>
              </div>
              <div>
                <span className="text-[10px] mono text-on-surface-variant/60">Headers</span>
                <div className="mt-1 space-y-1 text-[10px] text-on-surface">
                  {Object.entries(responseHeaders).length ? (
                    Object.entries(responseHeaders).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-semibold text-primary">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant/50">No headers</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-6 pt-0">
              <div className="w-full h-full bg-[#060e20] rounded-xl border border-outline-variant/10 p-6 overflow-auto scrollbar-thin">
                <pre className="mono text-sm leading-relaxed">
{responseText || "No response yet."}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden lg:flex w-72 h-full bg-[#131b2e] border-l border-[#494454]/10 flex-col overflow-y-auto">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#e84c1b] mb-4">Request Context</h3>
              <div className="space-y-4">
                <div className="bg-surface-container-high p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase mb-2">Environment</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">{environmentName}</span>
                    <span className="material-symbols-outlined text-sm text-primary">cloud_done</span>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase">Environment Variables</p>
                    <button
                      type="button"
                      onClick={handleAddVariable}
                      className="text-[10px] font-semibold text-secondary hover:text-secondary/80 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-auto">
                    {environmentEntries.map((entry) => {
                      const trimmedKey = entry.key.trim();
                      const isMissing = trimmedKey && missingVariables.includes(trimmedKey);
                      const inputClass = `flex-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
                        isMissing
                          ? "border-error/80 bg-error/5 text-error"
                          : "border-outline-variant/40 bg-surface-container-low text-on-surface"
                      }`;

                      return (
                        <div key={entry.id} className="flex gap-2">
                          <input
                            value={entry.key}
                            placeholder="key"
                            className={inputClass}
                            onChange={(event) => updateVariable(entry.id, "key", event.target.value)}
                          />
                          <input
                            value={entry.value}
                            placeholder="value"
                            className={inputClass}
                            onChange={(event) => updateVariable(entry.id, "value", event.target.value)}
                          />
                          <button
                            type="button"
                            className="text-sm text-on-surface-variant hover:text-error transition-colors"
                            onClick={() => removeVariable(entry.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-on-surface-variant/70 space-y-1">
                    {environmentEntries
                      .filter((entry) => entry.key.trim())
                      .map((entry) => (
                        <p key={`${entry.id}-preview`} className="flex items-center gap-1 font-mono">
                          <span className="text-primary">{`{{${entry.key.trim()}}}`}</span>
                          <span>→</span>
                          <span className="truncate">{entry.value || "–"}</span>
                        </p>
                      ))}
                  </div>
                  {missingVariables.length > 0 && (
                    <p className="text-[10px] text-error mt-1">
                      Missing variable{missingVariables.length === 1 ? "" : "s"}: {missingVariables.join(", ")}
                    </p>
                  )}
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase">Faker autocomplete</p>
                    <span className="text-[10px] text-secondary">Click to insert</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FAKER_VARIABLES.slice(0, 12).map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertAtCursor(variable)}
                        className="px-2 py-1 rounded bg-surface-container-low border border-outline-variant/30 text-[10px] font-semibold uppercase tracking-wider hover:border-primary focus:border-primary focus:outline-none"
                      >
                        {variable}
                      </button>
                    ))}
                    <span className="text-[10px] text-on-surface-variant/70">
                      +{FAKER_VARIABLES.length - 12} more
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase mb-2">Auth Status</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                    <span className="text-xs font-bold text-on-surface">Bearer Token Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#e84c1b]">History</h3>
                <span className="text-[10px] text-on-surface-variant/40 hover:text-primary cursor-pointer transition-colors">Clear All</span>
              </div>
              <div className="space-y-2">
                {[
                  { method: "POST", path: "/auth/renew", badge: "text-secondary", time: "2m ago" },
                  { method: "GET", path: "/v1/metrics", badge: "text-tertiary", time: "15m ago" },
                  { method: "DEL", path: "/temp/cache", badge: "text-error", time: "1h ago" },
                ].map((entry) => (
                  <div
                    key={entry.path}
                    className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black ${entry.badge}`}>{entry.method}</span>
                      <span className="text-[10px] mono text-on-surface-variant">{entry.path}</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/10">
              <div className="bg-gradient-to-br from-surface-container-high to-surface-container-highest p-4 rounded-xl border border-primary/10">
                <p className="text-[11px] font-bold text-primary uppercase mb-1">Architect Pro</p>
                <p className="text-[10px] text-on-surface-variant/60 leading-relaxed mb-3">
                  Sync your collections across team members in real-time.
                </p>
                <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black rounded-lg transition-all" type="button">
                  UPGRADE NOW
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-surface-container-highest/90 backdrop-blur shadow-2xl px-4 py-3 rounded-xl border border-outline-variant/20 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface">Request successful</p>
          <p className="text-[10px] text-on-surface-variant/60">Response cached for 300 seconds.</p>
        </div>
        <button className="ml-4 text-on-surface-variant/40 hover:text-on-surface" type="button">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

export default RequestBuilder;
