import TabPanel from "./TabPanel";

export type TabOption = "Params" | "Auth" | "Headers" | "Body";

type RequestTabsProps = {
  activeTab: TabOption;
  onTabChange: (tab: TabOption) => void;
};

const tabs: { label: TabOption; hasNotification?: boolean }[] = [
  { label: "Params" },
  { label: "Auth" },
  { label: "Headers" },
  { label: "Body", hasNotification: true },
];

const RequestTabs = ({ activeTab, onTabChange }: RequestTabsProps) => {
  return (
    <div className="mt-8">
      <div className="flex border-b border-outline-variant/10 gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={`pb-3 text-xs font-bold uppercase tracking-widest ${
              activeTab === tab.label
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant/60 hover:text-on-surface"
            } relative`}
            onClick={() => onTabChange(tab.label)}
          >
            {tab.label}
            {tab.hasNotification && (
              <span className="absolute top-0 -right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <TabPanel isActive={activeTab === "Params"}>
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs mono">
            <thead>
              <tr className="bg-surface-container-high/50 text-on-surface-variant/60 uppercase text-[10px] tracking-widest">
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-outline-variant/5">
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none text-primary focus:ring-0 p-0"
                    type="text"
                    value="user_id"
                    readOnly
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none text-on-surface focus:ring-0 p-0"
                    type="text"
                    value="u_928374"
                    readOnly
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none text-on-surface-variant/40 focus:ring-0 p-0 italic"
                    placeholder="Add description..."
                    type="text"
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="material-symbols-outlined text-sm text-error/40 hover:text-error cursor-pointer">
                    delete
                  </span>
                </td>
              </tr>
              <tr className="opacity-40">
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 p-0"
                    placeholder="New key"
                    type="text"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 p-0"
                    placeholder="New value"
                    type="text"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 p-0"
                    placeholder="Description"
                    type="text"
                  />
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === "Auth"}>
        <div className="bg-surface-container-lowest rounded-xl p-4 mono text-[11px] text-on-surface-variant/60 space-y-2">
          <p>
            Choose an authentication strategy for the request. Use Bearer, API Key, or OAuth tokens as needed, then copy the header into the preview.
          </p>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Selected</span>
            <span className="text-primary">Bearer Token</span>
          </div>
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === "Headers"}>
        <div className="bg-surface-container-lowest rounded-xl p-4 mono text-[11px] text-on-surface-variant/60">
          <p>Define headers such as Content-Type, Accept, or custom metadata.</p>
          <p className="uppercase text-[10px] tracking-widest text-on-surface-variant/40 mt-2">No headers defined</p>
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === "Body"}>
        <div className="bg-surface-container-lowest rounded-xl p-4 mono text-[11px] text-on-surface-variant/60">
          <p>JSON body preview (empty for GET). Use the visual editor below to insert objects and metadata.</p>
          <p className="text-[10px] tracking-widest uppercase mt-4 text-on-surface-variant/40">No body content yet</p>
        </div>
      </TabPanel>
    </div>
  );
};

export default RequestTabs;
