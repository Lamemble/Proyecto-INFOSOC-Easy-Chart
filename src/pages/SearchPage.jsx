import { useCallback, useEffect, useState } from "react";
import { supabase } from '../utils/supabase';
import { buscarDuenniosyMascotas } from "../services/search";


export function SearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [historialVisitas, setHistorialVisitas] = useState([]);
  const [mostrarFormVisita, setMostrarFormVisita] = useState(false);
  const [motivoVisita, setMotivoVisita] = useState('');
  const [observacionesVisita, setObservacionesVisita] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);

  const [mostrarArchivar, setMostrarArchivar] = useState(false);
  const [motivoArchivo, setMotivoArchivo] = useState('inactive_patient');
  const [nombreDueno, setNombreDueno] = useState('');
  const [telefonoDueno, setTelefonoDueno] = useState('');

  const [nombreMascota, setNombreMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");

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
    const { data: ownerData, error: ownerError } = await supabase
      .from("owners")
      .insert([
        {
          name: nombreDueno,
          phone: telefonoDueno
        }
      ]).select();
    if (ownerError) {
      alert("Error al guardar dueño: " + ownerError.message);
      return;
    }
    const nuevoDueñoId = ownerData[0].id;

    const { error } = await supabase
      .from("pets")
      .insert([{
        name: nombreMascota,
        species: especie,
        breed: raza,
        owner_id: nuevoDueñoId,
      }]);
    if (error) {
      alert("Hubo un error al guardar: " + error.message);
      console.error(error);
    } else {
      alert("'Ficha creada exitosamente");
    
      setNombreDueno("");
      setTelefonoDueno("");
      setNombreMascota("");
      setEspecie("");
      setRaza("");
      setMostrarForm(false);
    }

  };

  const cargarHistorial = useCallback(async (idMascota) => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('pet_id', idMascota)
      .order('visit_date', { ascending: false }); // Ordena de más reciente a más antiguo

    if (error) {
      console.error("Error cargando historial:", error);
    } else {
      setHistorialVisitas(data);
    }
  }, []);

  useEffect(() => {
    if (pacienteSeleccionado) {
      cargarHistorial(pacienteSeleccionado.id);
    } else {
      setHistorialVisitas([]);
    }
  }, [pacienteSeleccionado, cargarHistorial]);

  const manejarGuardadoVisita = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('visits')
      .insert([
        {
          pet_id: pacienteSeleccionado.id, // Vinculamos la visita a la mascota
          visit_date: new Date().toISOString().split('T')[0], // Guarda la fecha de hoy (YYYY-MM-DD)
          reason: motivoVisita, // Puede ser "Consulta", "Peluquería", "Vacuna"
          observations: observacionesVisita
        }
      ]);

    if (error) {
      alert("Error al guardar la visita: " + error.message);
    } else {
      alert("¡Visita registrada con éxito!");
      setMotivoVisita('');
      setObservacionesVisita('');
      setMostrarFormVisita(false);

      cargarHistorial(pacienteSeleccionado.id);
    }
  };

  const activarEdicion = () => {
    setNombreMascota(pacienteSeleccionado.name);
    setEspecie(pacienteSeleccionado.species);
    setRaza(pacienteSeleccionado.breed || '');
    setNombreDueno(pacienteSeleccionado.owners.name);
    setTelefonoDueno(pacienteSeleccionado.owners.phone || '');
    setModoEdicion(true);
  };
  const guardarEdicion = async (e) => {
    e.preventDefault();

    const { error: errorDueno } = await supabase
      .from('owners')
      .update({ name: nombreDueno, phone: telefonoDueno })
      .eq('id', pacienteSeleccionado.owners.id);

    if (errorDueno) {
      alert("Error al actualizar dueño: " + errorDueno.message);
      return;
    }

    const { error: errorMascota } = await supabase
      .from('pets')
      .update({ name: nombreMascota, species: especie, breed: raza })
      .eq('id', pacienteSeleccionado.id);

    if (errorMascota) {
      alert("Error al actualizar mascota: " + errorMascota.message);
    } else {
      alert("¡Datos actualizados correctamente!");
      setModoEdicion(false);
      setPacienteSeleccionado({
        ...pacienteSeleccionado,
        name: nombreMascota,
        species: especie,
        breed: raza,
        owners: {
          ...pacienteSeleccionado.owners,
          name: nombreDueno,
          phone: telefonoDueno
        }
      });
    }
  };
  const manejarArchivado = async () => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas dar de baja a ${pacienteSeleccionado.name}? Esta acción lo ocultará de las búsquedas.`);
    
    if (!confirmar) return;

    const { error } = await supabase
      .from('pets')
      .update({ 
        archived_at: new Date().toISOString(), 
        archive_reason: motivoArchivo 
      })
      .eq('id', pacienteSeleccionado.id);

    if (error) {
      alert("Error al archivar paciente: " + error.message);
    } else {
      alert("Paciente archivado exitosamente.");
      setMostrarArchivar(false);
      setPacienteSeleccionado(null);
      setSearch("");
      setResults([]);
    }
  };

  return (
    <div>
      <h1>Sistema Veterinaria</h1>
      {pacienteSeleccionado ? (
        <div>
          <button onClick={() => setPacienteSeleccionado(null)}>
            ← Volver al buscador
          </button>
          {modoEdicion ? (
            <form onSubmit={guardarEdicion} style={{ padding: '15px', border: '2px dashed #ff9800', backgroundColor: '#fffdf7' }}>
              <h3>Editando Datos</h3>
              
              <p><strong>Dueño:</strong></p>
              <input type="text" required value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} placeholder="Nombre Dueño" style={{ marginRight: '10px', padding: '5px' }} />
              <input type="text" value={telefonoDueno} onChange={(e) => setTelefonoDueno(e.target.value)} placeholder="Teléfono" style={{ padding: '5px' }} />

              <p><strong>Paciente:</strong></p>
              <input type="text" required value={nombreMascota} onChange={(e) => setNombreMascota(e.target.value)} placeholder="Nombre Mascota" style={{ marginRight: '10px', padding: '5px' }} />
              <input type="text" required value={especie} onChange={(e) => setEspecie(e.target.value)} placeholder="Especie" style={{ marginRight: '10px', padding: '5px' }} />
              <input type="text" value={raza} onChange={(e) => setRaza(e.target.value)} placeholder="Raza" style={{ padding: '5px' }} />
              
              <br /><br />
              <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', border: 'none', marginRight: '10px' }}>💾 Guardar Cambios</button>
              <button type="button" onClick={() => setModoEdicion(false)} style={{ padding: '10px' }}>Cancelar</button>
            </form>
          ) : (
            <div>
              <h2>Ficha Médica de: {pacienteSeleccionado.name}</h2>
              <p><strong>Especie:</strong> {pacienteSeleccionado.species} | <strong>Raza:</strong> {pacienteSeleccionado.breed || 'No especificada'}</p>
              <p><strong>Dueño responsable:</strong> {pacienteSeleccionado.owners.name} (Tel: {pacienteSeleccionado.owners.phone || 'Sin registro'})</p>
              
              <button onClick={activarEdicion} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>
                ✏️ Editar Datos
              </button>

              <button onClick={() => setMostrarArchivar(!mostrarArchivar)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>
                🗑️ Archivar Paciente
              </button>

              {mostrarArchivar && (
                <div style={{ marginTop: '15px', padding: '15px', border: '2px solid red', backgroundColor: '#ffebee' }}>
                  <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Atención: Estás a punto de dar de baja a este paciente.</p>
                  <label>Motivo: </label>
                  <select 
                    value={motivoArchivo} 
                    onChange={(e) => setMotivoArchivo(e.target.value)}
                    style={{ padding: '5px', marginLeft: '10px', marginBottom: '10px' }}
                  >
                    <option value="inactive_patient">Paciente Inactivo / Fallecido</option>
                    <option value="duplicate_record">Registro Duplicado</option>
                    <option value="data_entry_error">Error de Ingreso</option>
                    <option value="other">Otro</option>
                  </select>
                  <br />
                  <button onClick={manejarArchivado} style={{ backgroundColor: 'red', color: 'white', padding: '8px 15px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    Confirmar Archivado
                  </button>
                  <button onClick={() => setMostrarArchivar(false)} style={{ marginLeft: '10px', padding: '8px 15px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
          
          <hr />
          <button onClick={() => setMostrarFormVisita(!mostrarFormVisita)}>
            {mostrarFormVisita ? 'Cancelar' : '+Registrar Nueva Visita'}
          </button>

          {mostrarFormVisita && (
            <form onSubmit={manejarGuardadoVisita} style={{ marginTop: '20px', border: '1px solid gray', padding: '15px'}}>
              <h3>Detalles de la Atención</h3>

              <div style={{ marginBottom: '10px' }}>
                <label>Motivo (Consulta, Vacuna, Peluquería):</label>
                <input
                  type="text"
                  required
                  value={motivoVisita}
                  onChange={(e) => setMotivoVisita(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Observaciones:</label>
                <textarea
                  required
                  value={observacionesVisita}
                  onChange={(e) => setObservacionesVisita(e.target.value)}
                />
              </div>
              <button type="submit">💾 Guardar Registro</button>
            </form>
          )}

          <hr />
          <h3>Historial de Visitas</h3>

          {historialVisitas.length === 0 ? (
            <p>Este paciente no tiene visitas previas.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {historialVisitas.map((visita) => (
                <li key={visita.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <strong>Fecha:</strong> {visita.visit_date} <br />
                  <strong>Motivo:</strong> {visita.reason} <br />
                  <strong>Observaciones:</strong> {visita.observations}
                </li>
              ))}
            </ul>
          )}
        </div>
  ) : (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Sistema Veterinaria</h1>
      
      <button 
        onClick={() => setMostrarForm(!mostrarForm)}
        style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        {mostrarForm ? 'Cancelar Registro' : '+ Ingresar Nuevo Paciente'}
      </button>

      <br />

      {mostrarForm && (
        <form onSubmit={manejarGuardado} style={{ marginTop: '20px', marginBottom: '30px', border: '2px solid #ccc', padding: '30px', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
          
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px' }}>1. Datos del Cliente (Humano)</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Nombre Completo:</label>
            <input 
              type="text" required value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Teléfono:</label>
            <input 
              type="text" value={telefonoDueno} onChange={(e) => setTelefonoDueno(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px' }}
            />
          </div>

          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px' }}>2. Datos del Paciente (Mascota)</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Nombre de la Mascota:</label>
            <input 
              type="text" required value={nombreMascota} onChange={(e) => setNombreMascota(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Especie (Ej. Perro, Gato):</label>
            <input 
              type="text" required value={especie} onChange={(e) => setEspecie(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Raza:</label>
            <input 
              type="text" value={raza} onChange={(e) => setRaza(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '20px', fontSize: '22px', backgroundColor: '#008CBA', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            💾 Guardar Ficha Completa
          </button>
        </form>
      )}

      <hr style={{ marginTop: '40px', marginBottom: '20px' }} />

      <h2>Buscador Rápido</h2>
      <input
        type="text"
        placeholder="Buscar paciente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '10px', fontSize: '18px', width: '60%', marginRight: '10px' }}
      />
      <button onClick={handleSearch} style={{ padding: '10px 20px', fontSize: '18px' }}>Buscar</button>
      
      {loading && <p style={{ fontSize: '18px' }}>Cargando...</p>}
      {error && <p style={{ fontSize: '18px', color: 'red' }}>{error}</p>}
      {!loading && !error && results.length === 0 && <p style={{ fontSize: '18px' }}>Sin resultados</p>}
      
      {results.length > 0 && (
        <ul>
          {results.map((mascota) => (
            <li key={mascota.id}>
              {mascota.name} ({mascota.species})
              <button onClick={() => setPacienteSeleccionado(mascota)}>
                Ver Ficha
              </button>
            </li>
          ))}
        </ul>
        )}
    </div>
    )}
  </div>
  )
}
