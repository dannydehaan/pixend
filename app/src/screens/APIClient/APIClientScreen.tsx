import RequestBuilder from "../../components/api-client/RequestBuilder";

export const ApiClientScreen = () => (
  <div className="flex min-h-full flex-col gap-6 px-6 pb-10 pt-8">
    <header className="space-y-2">
      <p className="text-[12px] uppercase tracking-[0.4em] text-on-surface-variant">API Client</p>
      <h1 className="text-3xl font-black tracking-tight text-on-surface">Compose and test requests</h1>
      <p className="text-sm text-on-surface-variant">
        Build HTTP requests with custom headers, JSON bodies, and inspect every response without leaving the workspace.
      </p>
    </header>
    <RequestBuilder />
  </div>
);
