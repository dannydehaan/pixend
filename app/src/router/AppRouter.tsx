import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CollectionsScreen } from "../screens/Collections/CollectionsScreen";
import { LoginScreen } from "../screens/Login/LoginScreen";

const ProtectedRoute = () => {
  const { user, status, isGuest } = useAuth();

  if (status === "loading") {
    return <div className="text-center text-sm text-on-surface-variant">Validating session...</div>;
  }

  if (!isGuest && (status === "unauthenticated" || !user)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginScreen />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<CollectionsScreen />} />
      <Route path="/collections" element={<CollectionsScreen />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
