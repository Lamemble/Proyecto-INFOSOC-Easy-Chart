import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context.js";

export function LoginPage() {
  const { session, signInWithPassword } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Falta email o contraseña.");
      setSubmitting(false);
      return;
    }

    const { error: signInError } = await signInWithPassword(email, password);

    if (signInError) {
      setError("Error al iniciar sesión: " + signInError.message);
      setSubmitting(false);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" required />

      {error ? <p>{error}</p> : null}

      <button type="submit" disabled={submitting}>
        {submitting ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
