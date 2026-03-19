import { Collection, Workspace } from "../../../services/api";

const environment = () => ({
  id: 1,
  collection_id: 10,
  name: "Staging",
  region: "eu-west-1",
  description: "Environment",
  settings: null,
  created_at: new Date().toISOString(),
});

const collection = (): Collection => ({
  id: 10,
  workspace_id: 1,
  name: "Project Alpha",
  description: "Description",
  endpoint_count: 5,
  status: "draft",
  access_level: "private",
  created_at: new Date().toISOString(),
  environments: [environment()],
});

export const workspaceFactory = (): Workspace => ({
  id: 1,
  name: "Default Workspace",
  slug: "default",
  description: "Default",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  collections: [collection()],
  type: {
    id: 1,
    slug: "standard",
    name: "Standard",
    description: "Default",
  },
});
