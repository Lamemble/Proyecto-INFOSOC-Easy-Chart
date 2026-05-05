import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/auth-context.js";

export function ProtectedRoute() {
  const { loading, session } = useAuth();

  if (loading) {
    return <p>cargando...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
