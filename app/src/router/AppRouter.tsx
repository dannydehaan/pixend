import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CollectionsScreen } from "../screens/Collections/CollectionsScreen";
import { LoginScreen } from "../screens/Login/LoginScreen";

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
      <Route path="/" element={<CollectionsScreen />} />
      <Route path="/collections" element={<CollectionsScreen />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
