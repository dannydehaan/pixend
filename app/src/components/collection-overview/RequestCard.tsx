import type { RequestCardEntry } from "../../data/collectionOverviewData";

const RequestCard = ({ method, path, title, description, tags, accentColor }: RequestCardEntry) => (
  <div
    className="group relative bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all duration-300 border-l-4"
    style={{ borderColor: accentColor }}
  >
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-full bg-surface-container-highest text-outline uppercase">{method}</span>
          <span className="font-mono text-sm text-on-surface-variant">{path}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-1">{title}</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-outline">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="lg:w-48 flex justify-end">
        <button className="p-3 rounded-full bg-surface-container-highest text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
);

export default RequestCard;
