import { useState } from "react";
import { buscarDuenniosyMascotas } from "../services/search";

export function SearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");

    try {
      const data = await buscarDuenniosyMascotas(search);
      setResults(data);
    } catch {
      setError("Error al buscar. Intente nuevamente.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Busqueda</h1>
      <button>Nueva Ficha</button>
      <br />
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button onClick={handleSearch}>Buscar</button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && results.length === 0 && <p>Sin resultados</p>}
    </>
  );
}
