export type RequestCardEntry = {
  method: string;
  path: string;
  title: string;
  description: string;
  color: string;
  tags: string[];
};

type RequestFilter = {
  label: string;
  active?: boolean;
};

type HeroStat = {
  icon: string;
  label: string;
};

type HeroAction = {
  label: string;
  icon: string;
  variant: "primary" | "secondary";
};

type ResponseFormat = {
  label: string;
  tag: string;
};

type HealthStatus = {
  icon: string;
  title: string;
  description: string;
  indicator: string;
};

type InfoSidebarData = {
  baseUrl: string;
  authentication: string;
  responseFormats: ResponseFormat[];
  healthStatus: HealthStatus;
};

type DocsFooterData = {
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  links: string[];
};

export const navItems = [
  { icon: "folder_open", label: "Collections", active: true },
  { icon: "api", label: "APIs" },
  { icon: "cloud_queue", label: "Environments" },
  { icon: "dns", label: "Mock Servers" },
];

export const footerItems = [
  { icon: "settings", label: "Settings" },
  { icon: "help", label: "Help" },
];

export const requestFilters: RequestFilter[] = [
  { label: "All", active: true },
  { label: "Core" },
  { label: "Admin" },
];

export const catalogEntries: RequestCardEntry[] = [
  {
    method: "GET",
    path: "/v1/users/profile",
    title: "Retrieve User Profile",
    description:
      "Returns comprehensive user details including active subscriptions, security preferences, and metadata.",
    color: "border-l-4 border-blue-400",
    tags: ["Auth: Bearer", "Cache: 300s"],
  },
  {
    method: "POST",
    path: "/v1/resources/provision",
    title: "Provision Cloud Resource",
    description:
      "Initiates an asynchronous workflow to allocate new virtual infrastructure in the specified region.",
    color: "border-l-4 border-primary",
    tags: ["Body: JSON", "Priority: High"],
  },
  {
    method: "PATCH",
    path: "/v1/settings/network",
    title: "Update Network Config",
    description: "Modify existing VPC peering or subnet masks. Requires administrative tier permissions.",
    color: "border-l-4 border-amber-400",
    tags: ["Idempotent"],
  },
  {
    method: "DELETE",
    path: "/v1/auth/revoke-token",
    title: "Revoke Access Token",
    description: "Immediately invalidates the provided Bearer token across all global edge locations.",
    color: "border-l-4 border-error",
    tags: ["Destructive"],
  },
];

export const heroContent = {
  collectionLabel: "Collection",
  version: "v1.0.4",
  title: "Project Alpha API",
  description:
    "Core orchestration endpoints for the Project Alpha infrastructure. This collection manages user lifecycle, cloud resource provisioning, and real-time event streaming for global regions.",
  stats: [
    { icon: "description", label: "14 Endpoints" },
    { icon: "update", label: "Updated 2h ago" },
    { icon: "public", label: "Public Access" },
  ] as HeroStat[],
  actions: [
    { label: "Run Collection", icon: "play_arrow", variant: "primary" },
    { label: "Export Docs", icon: "share", variant: "secondary" },
  ] as HeroAction[],
};

export const infoSidebar: InfoSidebarData = {
  baseUrl: "https://api.alpha.pixend.io",
  authentication:
    "Project Alpha uses Bearer tokens for all requests. Tokens must be generated via the /auth/login endpoint and included in the header of every request.",
  responseFormats: [
    { label: "JSON", tag: "Default" },
    { label: "Protobuf", tag: "Optional" },
  ],
  healthStatus: {
    icon: "bolt",
    title: "Health Status",
    description: "All regions operational",
    indicator: "bg-emerald-400",
  },
};

export const docsFooter: DocsFooterData = {
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDYAbZm-5KDZcyV4VszyuOGQrPrsH7pL8JcNj-8gMnw5tKCjwf2gQPKoFYH3U8CIPu_rzmk2u_YDWvRw5Yhy7lVtpbp25QQpu1hF3UnfbBpELMmQDR7Io-zxvL6GTIpUYmiTqzOQ9-r1GnWTJHePdGIJROlX7K8-URVpCoMRtzoVMBTz8TVpTxkVqSTEjCO3vJkeNuy6g8XLAF24r53viei7IEDh17GmJ4DChsbjNNAGKoFszwq_l35gmKLzZTf2aKpUYrcRhqObDJk",
  imageAlt: "Abstract gradient mesh representing documentation handovers",
  title: "Agency Handover Bundle",
  subtitle: "Ready for production integration",
  links: ["Read API Policy", "Contact Support"],
};
