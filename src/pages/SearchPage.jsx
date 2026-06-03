import { useState } from "react";
import { supabase } from '../utils/supabase';
import { buscarDuenniosyMascotas } from "../services/search";


export function SearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombreMascota, setNombreMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [ownerId, setOwnerId] = useState("");

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

  const manejarGuardado = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("pets")
      .insert([{
        name: nombreMascota,
        species: especie,
        breed: raza,
        owner_id: ownerId,
      }]);
    if (error) {
      alert("Hubo un error al guardar: " + error.message);
      console.error(error);
    } else {
      alert("'Ficha creada exitosamente");
      setNombreMascota("");
      setEspecie("");
      setRaza("");
      setOwnerId("");
      setMostrarForm(false);
    }
  };
  return (
    <>
      <h1>Busqueda</h1>
      <button onClick={() => setMostrarForm(!mostrarForm)}>
        {mostrarForm ? 'Cancelar Ficha' : 'Nueva Ficha'}
      </button>
      <br />

      {mostrarForm && (
        <form onSubmit={manejarGuardado} style={{ marginTop: '20px', marginBottom: '20px', border: '1px solid black', padding: '20px' }}>
          <h3>Registrar Nuevo Paciente</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Nombre de la Mascota: </label>
            <input 
              type="text" 
              required
              value={nombreMascota} 
              onChange={(e) => setNombreMascota(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Especie (Ej. Perro, Gato): </label>
            <input 
              type="text" 
              required
              value={especie} 
              onChange={(e) => setEspecie(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Raza: </label>
            <input 
              type="text" 
              value={raza} 
              onChange={(e) => setRaza(e.target.value)} 
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>ID del Dueño (UUID): </label>
            <input 
              type="text" 
              required
              placeholder="Ej: 123e4567-e89b-12d3..."
              value={ownerId} 
              onChange={(e) => setOwnerId(e.target.value)} 
            />
          </div>
          <button type="submit">Guardar Ficha en Base de Datos</button>
        </form>
      )}
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
