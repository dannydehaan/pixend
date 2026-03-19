import type { ReactNode } from "react";

type TabDefinition = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

type TabPanelProps = {
  tabId: string;
  activeTab: string;
  children: ReactNode;
};

const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => (
  <div className="flex items-center gap-2 rounded-2xl border border-[#494454]/30 bg-[#0b1326]/80 p-1 text-xs font-semibold uppercase tracking-[0.35em]">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`flex-1 rounded-2xl px-4 py-2 transition-all ${
          activeTab === tab.id ? "bg-[#0f172a] text-primary" : "text-on-surface-variant hover:text-on-surface"
        }`}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const TabPanel = ({ tabId, activeTab, children }: TabPanelProps) => (
  <div className={`${activeTab === tabId ? "block" : "hidden"}`}>{children}</div>
);

export { Tabs, TabPanel };
