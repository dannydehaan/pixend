import { infoSidebar } from "../../data/collectionOverviewData";

const InfoSidebar = () => (
  <aside className="hidden xl:flex flex-col w-80 bg-surface-container-low border-l border-[#494454]/10 p-8 overflow-y-auto">
    <h2 className="text-xs font-headline font-semibold uppercase tracking-[0.2em] text-outline mb-6">Quick Specs</h2>
    <div className="space-y-8">
      <div>
        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">Base URL</span>
        <div className="p-3 bg-surface-container-lowest rounded-lg font-mono text-[11px] text-on-surface-variant border border-outline-variant/5">
          {infoSidebar.baseUrl}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">Authentication</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">{infoSidebar.authentication}</p>
      </div>
      <div>
        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">Response Formats</span>
        <div className="space-y-2">
          {infoSidebar.responseFormats.map((format) => (
            <div key={format.label} className="flex items-center justify-between text-xs">
              <span className="text-on-surface">{format.label}</span>
              <span className="text-outline text-[10px]">{format.tag}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-6">
        <div className="bg-surface-container-highest rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">{infoSidebar.healthStatus.icon}</span>
            <h4 className="text-xs font-bold text-on-surface">{infoSidebar.healthStatus.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${infoSidebar.healthStatus.indicator}`} />
            <span className="text-[10px] font-medium text-on-surface-variant">{infoSidebar.healthStatus.description}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
);

export default InfoSidebar;
