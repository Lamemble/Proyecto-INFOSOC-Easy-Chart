import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context.js";

export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <header>
        <h1>Easy Chart</h1>
        <button onClick={handleLogout} type="button">
          Cerrar sesión
        </button>
      </header>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
