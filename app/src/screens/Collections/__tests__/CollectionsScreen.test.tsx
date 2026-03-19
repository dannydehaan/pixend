import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionsScreen } from "../CollectionsScreen";
import { workspaceFactory } from "./fixtures";
import { apiClient } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useWorkspaces } from "../../../contexts/WorkspaceContext";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../contexts/WorkspaceContext", () => ({
  useWorkspaces: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  apiClient: {
    createCollection: vi.fn(),
    createEnvironment: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuth);
const useWorkspacesMock = vi.mocked(useWorkspaces);
const mockedApiClient = vi.mocked(apiClient);

describe("CollectionsScreen", () => {
  const refreshMock = vi.fn();
  let workspace = workspaceFactory();

  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { id: 1, name: "Test", email: "test@example.com" },
      token: "token",
      isLoading: false,
      isAuthenticated: true,
      isUnauthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
    workspace = workspaceFactory();
    useWorkspacesMock.mockReturnValue({
      workspaces: [workspace],
      loading: false,
      error: null,
      refresh: refreshMock,
      addCollectionToWorkspace: vi.fn(),
    });
  });

  afterEach(() => {
    refreshMock.mockReset();
  });

  it("creates a collection and refreshes workspaces", async () => {
    mockedApiClient.createCollection.mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <CollectionsScreen />
      </MemoryRouter>,
    );

    const [createButton] = screen.getAllByRole("button", { name: /New Collection/i });
    fireEvent.click(createButton);

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Project Beta" } });

    const descriptionInput = screen.getByLabelText("Description");
    fireEvent.change(descriptionInput, { target: { value: "Description" } });

    const submit = screen.getByRole("button", { name: /Create Collection/i });
    fireEvent.click(submit);

    await waitFor(() => expect(mockedApiClient.createCollection).toHaveBeenCalledWith({
      name: "Project Beta",
      description: "Description",
      workspace_id: workspace.id,
    }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("creates an environment for the selected collection", async () => {
    mockedApiClient.createEnvironment.mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <CollectionsScreen />
      </MemoryRouter>,
    );

    const environmentButton = screen.getByRole("button", { name: /New Environment/i });
    fireEvent.click(environmentButton);

    fireEvent.change(screen.getByLabelText("Environment name"), { target: { value: "Staging" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "eu-west-1" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Environment/i }));

    await waitFor(() => expect(mockedApiClient.createEnvironment).toHaveBeenCalledWith({
      collection_id: workspace.collections![0].id,
      name: "Staging",
      region: "eu-west-1",
      description: undefined,
    }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("shows validation errors when creation fails", async () => {
    const validationError = new Error("Invalid request") as Error & { details?: Record<string, string[]> };
    validationError.details = { name: ["Name is required"] };
    mockedApiClient.createCollection.mockRejectedValue(validationError);

    render(
      <MemoryRouter>
        <CollectionsScreen />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /New Collection/i })[0]);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Project Beta" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Collection/i }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });
});
