import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspacesProvider, useWorkspaces } from "../WorkspaceContext";
import { apiClient } from "../../services/api";

let mockAuthState = {
  status: "loading" as const,
  isAuthenticated: false,
  isUnauthenticated: true,
};

vi.mock("../AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("../../services/api", () => ({
  apiClient: {
    fetchWorkspaces: vi.fn(),
  },
}));

const workspaceRefreshRef = { current: () => Promise.resolve() };

const WorkspaceConsumer = () => {
  const { refresh } = useWorkspaces();

  useEffect(() => {
    workspaceRefreshRef.current = refresh;
  }, [refresh]);

  return null;
};

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderWorkspaceProvider = () => {
  const container = document.createElement("div");
  const root = ReactDOM.createRoot(container);

  act(() => {
    root.render(
      <WorkspacesProvider>
        <WorkspaceConsumer />
      </WorkspacesProvider>,
    );
  });

  return {
    root,
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

describe("WorkspacesProvider", () => {
  beforeEach(() => {
    apiClient.fetchWorkspaces.mockReset();
    mockAuthState = {
      status: "loading",
      isAuthenticated: false,
      isUnauthenticated: true,
    };
  });

  it("does not reach for workspaces before authentication", async () => {
    const { root, cleanup } = renderWorkspaceProvider();
    await flushMicrotasks();

    await act(async () => {
      await workspaceRefreshRef.current();
      await Promise.resolve();
    });
    await flushMicrotasks();

    expect(apiClient.fetchWorkspaces).not.toHaveBeenCalled();

    mockAuthState = {
      status: "authenticated",
      isAuthenticated: true,
      isUnauthenticated: false,
    };

    act(() => {
      root.render(
        <WorkspacesProvider>
          <WorkspaceConsumer />
        </WorkspacesProvider>,
      );
    });
    await flushMicrotasks();
    await flushMicrotasks();

    await act(async () => {
      await workspaceRefreshRef.current();
      await Promise.resolve();
    });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(apiClient.fetchWorkspaces).toHaveBeenCalled();

    cleanup();
  });
});
