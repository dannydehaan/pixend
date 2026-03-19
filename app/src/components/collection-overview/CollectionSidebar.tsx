import { navItems, footerItems } from "../../data/collectionOverviewData";

const CollectionSidebar = () => (
  <aside className="hidden md:flex flex-col h-full border-r border-[#494454]/10 bg-[#131b2e] w-64 flex-shrink-0">
    <div className="p-6 flex flex-col gap-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-sm">architecture</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-on-surface tracking-tight">Project Alpha</span>
          <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest text-[#dae2fd]/50">Engineering Team</span>
        </div>
      </div>
      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-surface-container-high text-primary font-['Inter'] text-xs font-semibold uppercase tracking-widest hover:bg-[#222a3d]/50 transition-all active:scale-95">
        <span className="material-symbols-outlined text-sm">add</span>
        New Collection
      </button>
    </div>

    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 px-3 py-3 rounded transition-transform cursor-pointer ${
            item.active
              ? "bg-[#222a3d] text-[#e84c1b] border-r-2 border-[#e84c1b]"
              : "text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </nav>

    <div className="p-3 border-t border-[#494454]/10 flex flex-col gap-1">
      {footerItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 px-3 py-3 rounded text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  </aside>
);

export default CollectionSidebar;
