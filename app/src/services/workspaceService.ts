import { apiClient, Workspace } from "./api";
import { createGuestWorkspace, loadGuestWorkspaces } from "./guestStorage";
import { isGuestMode } from "./guestSession";

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export const workspaceService = {
  async getWorkspaces(options?: { signal?: AbortSignal }): Promise<Workspace[]> {
    if (isGuestMode()) {
      return loadGuestWorkspaces();
    }

    return apiClient.fetchWorkspaces({ signal: options?.signal });
  },

  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    if (isGuestMode()) {
      return createGuestWorkspace(payload);
    }

    const response = await apiClient.createWorkspace({
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
    });

    return response;
  },
};
