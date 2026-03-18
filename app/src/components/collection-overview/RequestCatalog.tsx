import RequestCard from "./RequestCard";
import { catalogEntries, requestFilters } from "../../data/collectionOverviewData";

const RequestCatalog = () => (
  <section className="px-8 py-12 max-w-5xl mx-auto w-full">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-xs font-headline font-semibold uppercase tracking-[0.2em] text-outline">API Request Catalog</h2>
      <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
        {requestFilters.map((filter) => {
          const isActive = filter.active;
          return (
            <button
              type="button"
              key={filter.label}
              className={`px-3 py-1.5 rounded-md text-xs ${
                isActive
                  ? "bg-surface-container-high text-primary font-bold"
                  : "text-on-surface-variant font-medium hover:bg-surface-container-high/50"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-6">
      {catalogEntries.map((entry) => (
        <RequestCard key={`${entry.method}-${entry.path}`} {...entry} />
      ))}
    </div>
  </section>
);

export default RequestCatalog;
