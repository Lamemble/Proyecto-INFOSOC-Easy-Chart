import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context.js";

export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabActiva = searchParams.get("tab") === "fichas" ? "fichas" : "atenciones";

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function cambiarTab(tab) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tab);
      next.delete("visit");
      next.delete("pet");
      next.delete("newVisit");
      return next;
    });
  }

  const tabStyle = (tab) => ({
    padding: "10px 14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: tabActiva === tab ? "#e7f5fb" : "#fff",
    borderColor: tabActiva === tab ? "#008CBA" : "#ccc",
    fontWeight: tabActiva === tab ? "bold" : "normal",
    cursor: "pointer"
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4f6f8" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderBottom: "1px solid #d8dee4", backgroundColor: "#fff", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Easy Chart</h1>
        <nav style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => cambiarTab("atenciones")} style={tabStyle("atenciones")}>
            Atenciones
          </button>
          <button type="button" onClick={() => cambiarTab("fichas")} style={tabStyle("fichas")}>
            Fichas
          </button>
        </nav>
        <button onClick={handleLogout} type="button" style={{ marginLeft: "auto", padding: "10px 14px" }}>
          Cerrar sesión
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
