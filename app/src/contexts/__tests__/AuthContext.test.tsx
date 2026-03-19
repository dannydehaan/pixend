import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type UserSummary } from "../../services/api";
import { AuthProvider, type AuthStatus, type RefreshSessionOptions, useAuth } from "../AuthContext";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

var mockApiClient: Record<string, any>;

vi.mock("../../services/api", () => {
  mockApiClient = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    fetchWorkspaces: vi.fn(),
    getPersistedToken: vi.fn(),
    persistToken: vi.fn(),
    clearToken: vi.fn(),
    validateToken: vi.fn(),
  };

  return {
    apiClient: mockApiClient,
  };
});

const latestStatus = { current: null as AuthStatus | null };
const latestUser = { current: null as UserSummary | null };
const refreshRef = {
  current: (options?: RefreshSessionOptions) => Promise.resolve(),
};

const TestConsumer = () => {
  const { status, user, refreshSession } = useAuth();

  useEffect(() => {
    latestStatus.current = status;
  }, [status]);

  useEffect(() => {
    latestUser.current = user;
  }, [user]);

  useEffect(() => {
    refreshRef.current = refreshSession;
  }, [refreshSession]);

  return null;
};

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderAuth = () => {
  const container = document.createElement("div");
  const root = ReactDOM.createRoot(container);

  act(() => {
    root.render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
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

const resetMocks = () => {
  navigateMock.mockReset();
  for (const key of Object.keys(mockApiClient)) {
    const value = (mockApiClient as Record<string, any>)[key];
    if (value && typeof value.mockReset === "function") {
      value.mockReset();
    }
  }
};

const testUser: UserSummary = { id: 1, name: "Jane", email: "jane@example.com" };

describe("AuthProvider", () => {
  beforeEach(() => {
    resetMocks();
    latestStatus.current = null;
    latestUser.current = null;
  });

  afterEach(() => {
    navigateMock.mockReset();
  });

  it("calls /auth/me only once on startup", async () => {
    mockApiClient.getPersistedToken.mockResolvedValue("token-123");
    mockApiClient.validateToken.mockResolvedValue({ user: testUser });

    const { cleanup } = renderAuth();
    await flushMicrotasks();

    expect(mockApiClient.validateToken).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("keeps the user authenticated when the token is valid", async () => {
    mockApiClient.getPersistedToken.mockResolvedValue("token-123");
    mockApiClient.validateToken.mockResolvedValue({ user: testUser });

    const { cleanup } = renderAuth();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(latestStatus.current).toBe("authenticated");
    expect(latestUser.current).toEqual(testUser);
    expect(navigateMock).not.toHaveBeenCalled();

    cleanup();
  });

  it("redirects to login when /auth/me returns 401", async () => {
    mockApiClient.getPersistedToken.mockResolvedValue("token-123");
    mockApiClient.validateToken.mockRejectedValue({ status: 401 });

    const { cleanup } = renderAuth();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(latestStatus.current).toBe("unauthenticated");
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });

    cleanup();
  });

  it("ignores stale responses when a newer validation resolves first", async () => {
    mockApiClient.getPersistedToken.mockResolvedValue("token-123");

    const createControlled = () => {
      let resolve: (value: unknown) => void;
      let reject: (reason?: unknown) => void;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve: resolve!, reject: reject! };
    };

    const first = createControlled();
    const second = createControlled();

    mockApiClient.validateToken
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { cleanup } = renderAuth();
    await flushMicrotasks();

    act(() => {
      refreshRef.current({ abortPrevious: false });
    });
    await flushMicrotasks();

    await act(async () => {
      second.resolve({ user: testUser });
      await Promise.resolve();
    });
    await flushMicrotasks();

    expect(latestStatus.current).toBe("authenticated");
    expect(navigateMock).not.toHaveBeenCalled();

    await act(async () => {
      first.reject({ status: 401 });
      await Promise.resolve();
    });
    await flushMicrotasks();

    expect(latestStatus.current).toBe("authenticated");
    expect(navigateMock).not.toHaveBeenCalled();

    cleanup();
  });
});
