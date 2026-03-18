import type { ReactNode } from "react";

type TabPanelProps = {
  isActive: boolean;
  children: ReactNode;
};

const TabPanel = ({ isActive, children }: TabPanelProps) => {
  if (!isActive) return null;
  return <div className="mt-4">{children}</div>;
};

export default TabPanel;
