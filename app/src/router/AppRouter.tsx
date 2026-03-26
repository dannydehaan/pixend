import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CollectionsScreen } from "../screens/Collections/CollectionsScreen";
import { LoginScreen } from "../screens/Login/LoginScreen";
import { MockServersScreen } from "../screens/MockServers/MockServersScreen";
import { RegisterScreen } from "../screens/Register/RegisterScreen";
import { WorkspaceLayout } from "../layouts/WorkspaceLayout";
import { ApiClientScreen } from "../screens/APIClient/APIClientScreen";
import EnvironmentsScreen from "../screens/Environments/EnvironmentsScreen";
import NetworkInspectorScreen from "../screens/Network/NetworkInspectorScreen";

const ProtectedRoute = () => {
  const { user, status, isGuest } = useAuth();
  const navigate = useNavigate();

  const shouldRedirect = !isGuest && (status === "unauthenticated" || !user);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/login", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  if (status === "loading") {
    return <div className="text-center text-sm text-on-surface-variant">Validating session...</div>;
  }

  if (shouldRedirect) {
    return null;
  }

  return <Outlet />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginScreen />} />
    <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route index element={<CollectionsScreen />} />
          <Route path="collections" element={<CollectionsScreen />} />
          <Route path="api-client" element={<ApiClientScreen />} />
          <Route path="network" element={<NetworkInspectorScreen />} />
          <Route path="environments" element={<EnvironmentsScreen />} />
          <Route path="mock-servers" element={<MockServersScreen />} />
          <Route path="register" element={<RegisterScreen />} />
        </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
