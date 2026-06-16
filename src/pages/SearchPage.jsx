import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from '../utils/supabase';


const fechaHoy = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const meses = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];

const fechaLocalDesdeTexto = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const inicioDia = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatearFechaHumana = (value) => {
  const fecha = fechaLocalDesdeTexto(value);
  if (!fecha) return 'Sin fecha';

  const hoy = inicioDia(new Date());
  const fechaNormalizada = inicioDia(fecha);
  const diferenciaDias = Math.round((fechaNormalizada.getTime() - hoy.getTime()) / 86400000);

  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === -1) return 'Ayer';
  if (diferenciaDias === 1) return 'Mañana';

  return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
};

const textoOpcional = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const estaVacio = (value) => value === null || value === undefined || String(value).trim() === '';

const claveSugerencia = (value) => value.trim().toLowerCase();

const sugerenciasUnicas = (...grupos) => {
  const vistas = new Set();
  const sugerencias = [];

  grupos.flat().forEach((value) => {
    const text = String(value ?? '').trim();
    if (!text) return;

    const key = claveSugerencia(text);
    if (vistas.has(key)) return;

    vistas.add(key);
    sugerencias.push(text);
  });

  return sugerencias;
};

const numeroOpcional = (value) => {
  if (value === '') return null;
  return Number(value);
};

const esterilizadoDesdeFormulario = (value) => {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
};

const esterilizadoParaFormulario = (value) => {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
};

const etiquetaEsterilizado = (value) => {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  return null;
};

const etiquetaEdad = (paciente) => {
  if (paciente.birth_date) return formatearFechaHumana(paciente.birth_date);
  if (paciente.estimated_age_value && paciente.estimated_age_unit) {
    const unidades = {
      weeks: 'semanas',
      months: 'meses',
      years: 'años'
    };

    return `${paciente.estimated_age_value} ${unidades[paciente.estimated_age_unit] ?? paciente.estimated_age_unit}`;
  }

  return null;
};

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabActiva = searchParams.get('tab') === 'fichas' ? 'fichas' : 'atenciones';
  const petParam = searchParams.get('pet');
  const visitParam = searchParams.get('visit');
  const newVisitParam = searchParams.get('newVisit');

  const [busquedaFichas, setBusquedaFichas] = useState("");
  const [fichas, setFichas] = useState([]);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [historialVisitas, setHistorialVisitas] = useState([]);

  const [busquedaAtenciones, setBusquedaAtenciones] = useState("");
  const [atenciones, setAtenciones] = useState([]);
  const [atencionSeleccionada, setAtencionSeleccionada] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarFormVisita, setMostrarFormVisita] = useState(false);
  const [motivoVisita, setMotivoVisita] = useState('');
  const [observacionesVisita, setObservacionesVisita] = useState('');
  const [pacienteNuevaAtencionId, setPacienteNuevaAtencionId] = useState('');
  const [fechaVisita, setFechaVisita] = useState(fechaHoy());
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoEdicionAtencion, setModoEdicionAtencion] = useState(false);
  const [fechaAtencionEditada, setFechaAtencionEditada] = useState('');
  const [motivoAtencionEditado, setMotivoAtencionEditado] = useState('');
  const [observacionesAtencionEditadas, setObservacionesAtencionEditadas] = useState('');

  const [mostrarArchivar, setMostrarArchivar] = useState(false);
  const [motivoArchivo, setMotivoArchivo] = useState('inactive_patient');
  const [nombreDueno, setNombreDueno] = useState('');
  const [telefonoDueno, setTelefonoDueno] = useState('');
  const [emailDueno, setEmailDueno] = useState('');
  const [direccionDueno, setDireccionDueno] = useState('');

  const [nombreMascota, setNombreMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edadAproximada, setEdadAproximada] = useState("");
  const [unidadEdadAproximada, setUnidadEdadAproximada] = useState("years");
  const [esterilizado, setEsterilizado] = useState("");

  const pacienteDesdeAtencion = atencionSeleccionada?.pets ?? null;
  const pacienteSeleccionado = tabActiva === "fichas" ? fichaSeleccionada : pacienteDesdeAtencion;
  const especiesSugeridas = useMemo(() => sugerenciasUnicas(
    ['Perro', 'Gato'],
    fichas.map((ficha) => ficha.species),
    atenciones.map((atencion) => atencion.pets?.species)
  ), [atenciones, fichas]);
  const motivosSugeridos = useMemo(() => sugerenciasUnicas(
    ['Consulta', 'Vacuna', 'Peluquería', 'Examen', 'Control', 'Otro'],
    atenciones.map((atencion) => atencion.reason),
    historialVisitas.map((visita) => visita.reason)
  ), [atenciones, historialVisitas]);

  const cargarFichas = useCallback(async (termino = "") => {
    setLoading(true);
    setError("");

    const { data, error: errorFichas } = await supabase
      .from("pets")
      .select(`
        id,
        name,
        species,
        breed,
        birth_date,
        estimated_age_value,
        estimated_age_unit,
        is_sterilized,
        owners!inner(
          id,
          name,
          phone,
          email,
          address
        )
      `)
      .is("archived_at", null)
      .is("owners.archived_at", null)
      .order("name", { ascending: true });

    if (errorFichas) {
      setError("Error al cargar fichas: " + errorFichas.message);
      setFichas([]);
      setLoading(false);
      return;
    }

    const q = termino.trim().toLowerCase();
    const lista = data ?? [];
    const filtradas = q
      ? lista.filter((ficha) => {
        const texto = [
          ficha.name,
          ficha.species,
          ficha.breed,
          ficha.birth_date,
          ficha.estimated_age_value,
          ficha.estimated_age_unit,
          etiquetaEsterilizado(ficha.is_sterilized),
          ficha.owners.name,
          ficha.owners.phone,
          ficha.owners.email,
          ficha.owners.address
        ].filter(Boolean).join(" ").toLowerCase();

        return texto.includes(q);
      })
      : lista;

    setFichas(filtradas);
    setLoading(false);
  }, []);

  const cargarAtenciones = useCallback(async (termino = "") => {
    setLoading(true);
    setError("");

    const { data, error: errorAtenciones } = await supabase
      .from('visits')
      .select(`
        id,
        pet_id,
        visit_date,
        reason,
        observations,
        pets!inner(
          id,
          name,
          species,
          breed,
          birth_date,
          estimated_age_value,
          estimated_age_unit,
          is_sterilized,
          owners!inner(
            id,
            name,
            phone,
            email,
            address
          )
        )
      `)
      .is('archived_at', null)
      .is('pets.archived_at', null)
      .is('pets.owners.archived_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (errorAtenciones) {
      setError("Error al cargar atenciones: " + errorAtenciones.message);
      setAtenciones([]);
      setLoading(false);
      return;
    }

    const q = termino.trim().toLowerCase();
    const visitas = data ?? [];
    const filtradas = q
      ? visitas.filter((visita) => {
        const mascota = visita.pets;
        const dueno = mascota.owners;
        const texto = [
          visita.visit_date,
          visita.reason,
          visita.observations,
          mascota.name,
          mascota.species,
          mascota.breed,
          mascota.birth_date,
          mascota.estimated_age_value,
          mascota.estimated_age_unit,
          etiquetaEsterilizado(mascota.is_sterilized),
          dueno.name,
          dueno.phone,
          dueno.email,
          dueno.address
        ].filter(Boolean).join(" ").toLowerCase();

        return texto.includes(q);
      })
      : visitas;

    setAtenciones(filtradas);
    setLoading(false);
  }, []);

  const cargarHistorial = useCallback(async (idMascota) => {
    const { data, error: errorHistorial } = await supabase
      .from('visits')
      .select('*')
      .eq('pet_id', idMascota)
      .is('archived_at', null)
      .order('visit_date', { ascending: false });

    if (errorHistorial) {
      console.error("Error cargando historial:", errorHistorial);
      setHistorialVisitas([]);
    } else {
      setHistorialVisitas(data ?? []);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cargarFichas();
      cargarAtenciones();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cargarAtenciones, cargarFichas]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (tabActiva !== 'fichas' || !petParam || fichas.length === 0 || fichaSeleccionada?.id === petParam) {
      return undefined;
    }

    const fichaDesdeUrl = fichas.find((ficha) => ficha.id === petParam);
    if (!fichaDesdeUrl) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFichaSeleccionada(fichaDesdeUrl);
      setAtencionSeleccionada(null);
      setMostrarForm(false);
      setMostrarFormVisita(false);
      setPacienteNuevaAtencionId('');
      setModoEdicion(false);
      setModoEdicionAtencion(false);
      setMostrarArchivar(false);
      cargarHistorial(fichaDesdeUrl.id);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cargarHistorial, fichaSeleccionada?.id, fichas, petParam, tabActiva]);

  useEffect(() => {
    if (tabActiva !== 'fichas' || petParam || !fichaSeleccionada) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFichaSeleccionada(null);
      setHistorialVisitas([]);
      setAtencionSeleccionada(null);
      setMostrarFormVisita(false);
      setPacienteNuevaAtencionId('');
      setModoEdicion(false);
      setModoEdicionAtencion(false);
      setMostrarArchivar(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fichaSeleccionada, petParam, tabActiva]);

  useEffect(() => {
    if (tabActiva !== 'atenciones' || !visitParam || atenciones.length === 0 || atencionSeleccionada?.id === visitParam) {
      return undefined;
    }

    const atencionDesdeUrl = atenciones.find((atencion) => atencion.id === visitParam);
    if (!atencionDesdeUrl) return undefined;

    const timeoutId = window.setTimeout(() => {
      setAtencionSeleccionada(atencionDesdeUrl);
      setFichaSeleccionada(null);
      setHistorialVisitas([]);
      setMostrarForm(false);
      setMostrarFormVisita(false);
      setPacienteNuevaAtencionId('');
      setModoEdicion(false);
      setModoEdicionAtencion(false);
      setMostrarArchivar(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [atencionSeleccionada?.id, atenciones, tabActiva, visitParam]);

  useEffect(() => {
    if (tabActiva !== 'atenciones' || newVisitParam !== '1') {
      return undefined;
    }

    if (mostrarFormVisita && !atencionSeleccionada && !fichaSeleccionada && !mostrarForm && !modoEdicion && !mostrarArchivar) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAtencionSeleccionada(null);
      setFichaSeleccionada(null);
      setHistorialVisitas([]);
      setMostrarForm(false);
      setMostrarFormVisita(true);
      setPacienteNuevaAtencionId('');
      setModoEdicion(false);
      setModoEdicionAtencion(false);
      setMostrarArchivar(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [atencionSeleccionada, fichaSeleccionada, modoEdicion, mostrarArchivar, mostrarForm, mostrarFormVisita, newVisitParam, tabActiva]);

  useEffect(() => {
    if (tabActiva !== 'atenciones' || visitParam || newVisitParam || (!atencionSeleccionada && !mostrarFormVisita)) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAtencionSeleccionada(null);
      setFichaSeleccionada(null);
      setHistorialVisitas([]);
      setMostrarForm(false);
      setMostrarFormVisita(false);
      setPacienteNuevaAtencionId('');
      setModoEdicion(false);
      setModoEdicionAtencion(false);
      setMostrarArchivar(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [atencionSeleccionada, mostrarFormVisita, newVisitParam, tabActiva, visitParam]);

  const mostrarToast = (type, message) => {
    setToast({ type, message });
  };

  async function handleBuscarFichas() {
    await cargarFichas(busquedaFichas);
  }

  async function handleBuscarAtenciones() {
    await cargarAtenciones(busquedaAtenciones);
  }

  const resetearPaneles = () => {
    setMostrarForm(false);
    setMostrarFormVisita(false);
    setPacienteNuevaAtencionId('');
    setModoEdicion(false);
    setModoEdicionAtencion(false);
    setMostrarArchivar(false);
  };

  const limpiarFormularioPaciente = () => {
    setNombreDueno("");
    setTelefonoDueno("");
    setEmailDueno("");
    setDireccionDueno("");
    setNombreMascota("");
    setEspecie("");
    setRaza("");
    setFechaNacimiento("");
    setEdadAproximada("");
    setUnidadEdadAproximada("years");
    setEsterilizado("");
  };

  const limpiarFormularioAtencion = () => {
    setFechaVisita(fechaHoy());
    setMotivoVisita('');
    setObservacionesVisita('');
    setPacienteNuevaAtencionId('');
  };

  const cargarFormularioAtencionSeleccionada = (atencion) => {
    setFechaAtencionEditada(atencion.visit_date || fechaHoy());
    setMotivoAtencionEditado(atencion.reason || '');
    setObservacionesAtencionEditadas(atencion.observations || '');
    setModoEdicionAtencion(true);
  };

  const seleccionarFicha = async (ficha) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', 'fichas');
      next.set('pet', ficha.id);
      next.delete('visit');
      next.delete('newVisit');
      return next;
    });
    setFichaSeleccionada(ficha);
    setAtencionSeleccionada(null);
    resetearPaneles();
    await cargarHistorial(ficha.id);
  };

  const seleccionarAtencion = (atencion) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', 'atenciones');
      next.set('visit', atencion.id);
      next.delete('pet');
      next.delete('newVisit');
      return next;
    });
    setAtencionSeleccionada(atencion);
    setFichaSeleccionada(null);
    setHistorialVisitas([]);
    resetearPaneles();
  };

  const abrirFichaDesdeAtencion = async () => {
    if (!pacienteDesdeAtencion) return;

    await seleccionarFicha(pacienteDesdeAtencion);
  };

  const manejarGuardado = async (e) => {
    e.preventDefault();

    if (!nombreMascota.trim()) {
      mostrarToast('warning', "El nombre de la mascota es necesario para crear una ficha.");
      return;
    }

    const { data: ownerData, error: ownerError } = await supabase
      .from("owners")
      .insert([
        {
          name: textoOpcional(nombreDueno),
          phone: textoOpcional(telefonoDueno),
          email: textoOpcional(emailDueno),
          address: textoOpcional(direccionDueno)
        }
      ]).select();

    if (ownerError) {
      mostrarToast('error', "Error al guardar dueño: " + ownerError.message);
      return;
    }

    const nuevoDueñoId = ownerData[0].id;

    const { data: petData, error } = await supabase
      .from("pets")
      .insert([{
        name: nombreMascota.trim(),
        species: textoOpcional(especie),
        breed: textoOpcional(raza),
        birth_date: fechaNacimiento || null,
        estimated_age_value: numeroOpcional(edadAproximada),
        estimated_age_unit: edadAproximada === '' ? null : unidadEdadAproximada,
        is_sterilized: esterilizadoDesdeFormulario(esterilizado),
        owner_id: nuevoDueñoId,
      }])
      .select(`
        id,
        name,
        species,
        breed,
        birth_date,
        estimated_age_value,
        estimated_age_unit,
        is_sterilized,
        owners!inner(
          id,
          name,
          phone,
          email,
          address
        )
      `);

    if (error) {
      mostrarToast('error', "Hubo un error al guardar: " + error.message);
      console.error(error);
    } else {
      mostrarToast('success', "Ficha creada exitosamente");

      const nuevaFicha = petData?.[0];
      const tienePrimeraAtencion = motivoVisita.trim() || observacionesVisita.trim();

      if (nuevaFicha && tienePrimeraAtencion) {
        const { error: errorPrimeraAtencion } = await supabase
          .from('visits')
          .insert([
            {
              pet_id: nuevaFicha.id,
              visit_date: fechaVisita || fechaHoy(),
              reason: textoOpcional(motivoVisita),
              observations: textoOpcional(observacionesVisita)
            }
          ]);

        if (errorPrimeraAtencion) {
          mostrarToast('warning', "Ficha creada, pero no se pudo guardar la primera atención: " + errorPrimeraAtencion.message);
        }
      }

      limpiarFormularioPaciente();
      limpiarFormularioAtencion();
      setMostrarForm(false);
      await cargarFichas(busquedaFichas);
      await cargarAtenciones(busquedaAtenciones);

      if (nuevaFicha) {
        await seleccionarFicha(nuevaFicha);
      }
    }
  };

  const manejarGuardadoVisita = async (e) => {
    e.preventDefault();

    const pacienteParaAtencionId = pacienteNuevaAtencionId || pacienteSeleccionado?.id;

    if (!pacienteParaAtencionId) {
      mostrarToast('warning', "Selecciona una ficha o atención antes de registrar una nueva atención.");
      return;
    }

    if (!motivoVisita.trim() && !observacionesVisita.trim()) {
      mostrarToast('warning', "Escribe al menos un motivo u observación para guardar la atención.");
      return;
    }

    const { data, error } = await supabase
      .from('visits')
      .insert([
        {
          pet_id: pacienteParaAtencionId,
          visit_date: fechaVisita || fechaHoy(),
          reason: textoOpcional(motivoVisita),
          observations: textoOpcional(observacionesVisita)
        }
      ])
      .select(`
        id,
        pet_id,
        visit_date,
        reason,
        observations,
        pets!inner(
          id,
          name,
          species,
          breed,
          birth_date,
          estimated_age_value,
          estimated_age_unit,
          is_sterilized,
          owners!inner(
            id,
            name,
            phone,
            email,
            address
          )
        )
      `);

    if (error) {
      mostrarToast('error', "Error al guardar la visita: " + error.message);
    } else {
      mostrarToast('success', "Visita registrada con éxito");
      limpiarFormularioAtencion();
      setMostrarFormVisita(false);
      await cargarAtenciones(busquedaAtenciones);

      if (tabActiva === "fichas") {
        await cargarHistorial(pacienteParaAtencionId);
      } else if (data?.[0]) {
        seleccionarAtencion(data[0]);
      }
    }
  };

  const guardarEdicionAtencion = async (e) => {
    e.preventDefault();

    if (!atencionSeleccionada) return;

    if (!motivoAtencionEditado.trim() && !observacionesAtencionEditadas.trim()) {
      mostrarToast('warning', "Escribe al menos un motivo u observación para guardar la atención.");
      return;
    }

    const camposActualizados = {
      visit_date: fechaAtencionEditada || fechaHoy(),
      reason: textoOpcional(motivoAtencionEditado),
      observations: textoOpcional(observacionesAtencionEditadas)
    };

    const { error } = await supabase
      .from('visits')
      .update(camposActualizados)
      .eq('id', atencionSeleccionada.id);

    if (error) {
      mostrarToast('error', "Error al actualizar atención: " + error.message);
      return;
    }

    const atencionActualizada = {
      ...atencionSeleccionada,
      ...camposActualizados
    };

    mostrarToast('success', "Atención actualizada correctamente");
    setAtencionSeleccionada(atencionActualizada);
    setAtenciones((visitas) => visitas.map((visita) => (
      visita.id === atencionActualizada.id ? atencionActualizada : visita
    )));
    setModoEdicionAtencion(false);
    await cargarAtenciones(busquedaAtenciones);
  };

  const activarEdicion = () => {
    if (!pacienteSeleccionado) return;

    setNombreMascota(pacienteSeleccionado.name);
    setEspecie(pacienteSeleccionado.species);
    setRaza(pacienteSeleccionado.breed || '');
    setNombreDueno(pacienteSeleccionado.owners.name || '');
    setTelefonoDueno(pacienteSeleccionado.owners.phone || '');
    setEmailDueno(pacienteSeleccionado.owners.email || '');
    setDireccionDueno(pacienteSeleccionado.owners.address || '');
    setFechaNacimiento(pacienteSeleccionado.birth_date || '');
    setEdadAproximada(pacienteSeleccionado.estimated_age_value ?? '');
    setUnidadEdadAproximada(pacienteSeleccionado.estimated_age_unit || 'years');
    setEsterilizado(esterilizadoParaFormulario(pacienteSeleccionado.is_sterilized));
    setModoEdicion(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();

    if (!pacienteSeleccionado) return;

    if (!nombreMascota.trim()) {
      mostrarToast('warning', "El nombre de la mascota es necesario para guardar la ficha.");
      return;
    }

    const { error: errorDueno } = await supabase
      .from('owners')
      .update({
        name: textoOpcional(nombreDueno),
        phone: textoOpcional(telefonoDueno),
        email: textoOpcional(emailDueno),
        address: textoOpcional(direccionDueno)
      })
      .eq('id', pacienteSeleccionado.owners.id);

    if (errorDueno) {
      mostrarToast('error', "Error al actualizar dueño: " + errorDueno.message);
      return;
    }

    const { error: errorMascota } = await supabase
      .from('pets')
      .update({
        name: nombreMascota.trim(),
        species: textoOpcional(especie),
        breed: textoOpcional(raza),
        birth_date: fechaNacimiento || null,
        estimated_age_value: numeroOpcional(edadAproximada),
        estimated_age_unit: edadAproximada === '' ? null : unidadEdadAproximada,
        is_sterilized: esterilizadoDesdeFormulario(esterilizado)
      })
      .eq('id', pacienteSeleccionado.id);

    if (errorMascota) {
      mostrarToast('error', "Error al actualizar mascota: " + errorMascota.message);
    } else {
      const mascotaActualizada = {
        ...pacienteSeleccionado,
        name: nombreMascota.trim(),
        species: textoOpcional(especie),
        breed: textoOpcional(raza),
        birth_date: fechaNacimiento || null,
        estimated_age_value: numeroOpcional(edadAproximada),
        estimated_age_unit: edadAproximada === '' ? null : unidadEdadAproximada,
        is_sterilized: esterilizadoDesdeFormulario(esterilizado),
        owners: {
          ...pacienteSeleccionado.owners,
          name: textoOpcional(nombreDueno),
          phone: textoOpcional(telefonoDueno),
          email: textoOpcional(emailDueno),
          address: textoOpcional(direccionDueno)
        }
      };

      mostrarToast('success', "Datos actualizados correctamente");
      setModoEdicion(false);

      if (tabActiva === "fichas") {
        setFichaSeleccionada(mascotaActualizada);
        await cargarFichas(busquedaFichas);
      } else {
        setAtencionSeleccionada({
          ...atencionSeleccionada,
          pets: mascotaActualizada
        });
        await cargarAtenciones(busquedaAtenciones);
      }
    }
  };

  const manejarArchivado = async () => {
    if (!pacienteSeleccionado) return;

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
      mostrarToast('error', "Error al archivar paciente: " + error.message);
    } else {
      mostrarToast('success', "Paciente archivado exitosamente.");
      setFichaSeleccionada(null);
      setAtencionSeleccionada(null);
      setHistorialVisitas([]);
      resetearPaneles();
      await cargarFichas(busquedaFichas);
      await cargarAtenciones(busquedaAtenciones);
    }
  };

  const panelStyle = {
    border: '1px solid #d8dee4',
    borderRadius: 0,
    padding: '16px',
    backgroundColor: '#fff',
    height: '100%',
    minHeight: 0,
    overflowY: 'auto',
    boxSizing: 'border-box'
  };

  const appPageStyle = {
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
    backgroundColor: '#f4f6f8'
  };

  const workspaceGridStyle = (columns) => ({
    display: 'grid',
    gridTemplateColumns: columns,
    gap: '12px',
    height: '100%',
    minHeight: 0,
    minWidth: '1180px',
    alignItems: 'stretch'
  });

  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px',
    marginTop: '6px',
    marginBottom: '12px'
  };

  const primaryButtonStyle = {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#008CBA',
    color: 'white',
    cursor: 'pointer'
  };

  const secondaryButtonStyle = {
    padding: '10px 14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  };

  const listCardButtonStyle = (selected) => ({
    width: '100%',
    display: 'block',
    textAlign: 'left',
    border: selected ? '1px solid #008CBA' : '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    backgroundColor: selected ? '#eef6ff' : '#fff',
    cursor: 'pointer',
    boxShadow: selected ? '0 2px 8px rgba(0, 140, 186, 0.12)' : 'none'
  });

  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '14px',
    backgroundColor: '#fff',
    marginBottom: '12px'
  };

  const mutedTextStyle = {
    color: '#666',
    fontSize: '14px',
    margin: '4px 0'
  };

  const emptyValueStyle = {
    color: '#9aa4af',
    fontStyle: 'italic'
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    margin: '14px 0'
  };

  const infoItemStyle = {
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '10px',
    backgroundColor: '#fafafa'
  };

  const infoLabelStyle = {
    display: 'block',
    color: '#666',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '4px',
    textTransform: 'uppercase'
  };

  const renderInfoItem = (label, value) => (
    <div style={infoItemStyle}>
      <span style={infoLabelStyle}>{label}</span>
      {estaVacio(value) ? (
        <span style={emptyValueStyle}>Sin registro</span>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );

  const renderValor = (value, fallback) => (
    estaVacio(value) ? <span style={emptyValueStyle}>{fallback}</span> : value
  );

  const toastStyle = {
    position: 'fixed',
    top: '18px',
    right: '18px',
    maxWidth: '380px',
    padding: '14px 16px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    backgroundColor: toast?.type === 'error' ? '#ffebee' : toast?.type === 'warning' ? '#fff8e1' : '#e8f5e9',
    color: toast?.type === 'error' ? '#b71c1c' : toast?.type === 'warning' ? '#795548' : '#1b5e20',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
    zIndex: 10
  };

  const renderFormularioFicha = () => (
    <form onSubmit={manejarGuardado}>
      <h3>Nueva ficha</h3>

      <h4>Datos del dueño</h4>
      <label>
        Nombre completo
        <input type="text" value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Teléfono
        <input type="text" value={telefonoDueno} onChange={(e) => setTelefonoDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Email
        <input type="email" value={emailDueno} onChange={(e) => setEmailDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Dirección
        <input type="text" value={direccionDueno} onChange={(e) => setDireccionDueno(e.target.value)} style={fieldStyle} />
      </label>

      <h4>Datos del paciente</h4>
      <label>
        Nombre de la mascota
        <input type="text" required value={nombreMascota} onChange={(e) => setNombreMascota(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Especie
        <input
          type="text"
          list="species-options"
          placeholder="Perro, Gato u otra"
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Raza
        <input type="text" value={raza} onChange={(e) => setRaza(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Fecha de nacimiento
        <input type="date" max={fechaHoy()} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Edad aproximada
        <input type="number" min="0.1" step="0.1" value={edadAproximada} onChange={(e) => setEdadAproximada(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Unidad edad aproximada
        <select value={unidadEdadAproximada} onChange={(e) => setUnidadEdadAproximada(e.target.value)} style={fieldStyle}>
          <option value="weeks">Semanas</option>
          <option value="months">Meses</option>
          <option value="years">Años</option>
        </select>
      </label>
      <label>
        Esterilizado
        <select value={esterilizado} onChange={(e) => setEsterilizado(e.target.value)} style={fieldStyle}>
          <option value="">Sin registro</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </select>
      </label>

      <h4>Primera atención opcional</h4>
      <label>
        Fecha atención
        <input type="date" value={fechaVisita} onChange={(e) => setFechaVisita(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Motivo
        <input
          type="text"
          list="visit-reason-options"
          placeholder="Consulta, Vacuna, Peluquería u otro"
          value={motivoVisita}
          onChange={(e) => setMotivoVisita(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Observaciones
        <textarea value={observacionesVisita} onChange={(e) => setObservacionesVisita(e.target.value)} style={{ ...fieldStyle, minHeight: '90px' }} />
      </label>

      <button type="submit" style={primaryButtonStyle}>Guardar ficha</button>
    </form>
  );

  const renderFormularioEdicion = () => (
    <form onSubmit={guardarEdicion}>
      <h4>Dueño</h4>
      <label>
        Nombre
        <input type="text" value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Teléfono
        <input type="text" value={telefonoDueno} onChange={(e) => setTelefonoDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Email
        <input type="email" value={emailDueno} onChange={(e) => setEmailDueno(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Dirección
        <input type="text" value={direccionDueno} onChange={(e) => setDireccionDueno(e.target.value)} style={fieldStyle} />
      </label>

      <h4>Paciente</h4>
      <label>
        Nombre
        <input type="text" required value={nombreMascota} onChange={(e) => setNombreMascota(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Especie
        <input
          type="text"
          list="species-options"
          placeholder="Perro, Gato u otra"
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Raza
        <input type="text" value={raza} onChange={(e) => setRaza(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Fecha de nacimiento
        <input type="date" max={fechaHoy()} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Edad aproximada
        <input type="number" min="0.1" step="0.1" value={edadAproximada} onChange={(e) => setEdadAproximada(e.target.value)} style={fieldStyle} />
      </label>
      <label>
        Unidad edad aproximada
        <select value={unidadEdadAproximada} onChange={(e) => setUnidadEdadAproximada(e.target.value)} style={fieldStyle}>
          <option value="weeks">Semanas</option>
          <option value="months">Meses</option>
          <option value="years">Años</option>
        </select>
      </label>
      <label>
        Esterilizado
        <select value={esterilizado} onChange={(e) => setEsterilizado(e.target.value)} style={fieldStyle}>
          <option value="">Sin registro</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </select>
      </label>

      <button type="submit" style={primaryButtonStyle}>Guardar cambios</button>
      <button type="button" onClick={() => setModoEdicion(false)} style={{ ...secondaryButtonStyle, marginLeft: '8px' }}>
        Cancelar
      </button>
    </form>
  );

  const renderFormularioAtencion = () => (
    <form onSubmit={manejarGuardadoVisita} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
      {tabActiva === "atenciones" && (
        <label>
          Paciente
          <select
            required
            value={pacienteNuevaAtencionId || pacienteDesdeAtencion?.id || ''}
            onChange={(e) => setPacienteNuevaAtencionId(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Seleccionar paciente</option>
            {fichas.map((ficha) => (
              <option key={ficha.id} value={ficha.id}>
                {ficha.name} - {ficha.owners.name || 'Sin dueño'}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Fecha atención
        <input
          type="date"
          value={fechaVisita}
          onChange={(e) => setFechaVisita(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Motivo
        <input
          type="text"
          list="visit-reason-options"
          placeholder="Consulta, Vacuna, Peluquería u otro"
          value={motivoVisita}
          onChange={(e) => setMotivoVisita(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Observaciones
        <textarea
          value={observacionesVisita}
          onChange={(e) => setObservacionesVisita(e.target.value)}
          style={{ ...fieldStyle, minHeight: '110px' }}
        />
      </label>
      <button type="submit" style={primaryButtonStyle}>Guardar registro</button>
    </form>
  );

  const renderDatosPaciente = () => {
    if (!pacienteSeleccionado) {
      return <p>Selecciona una ficha o atención para ver los datos del paciente.</p>;
    }

    if (modoEdicion) {
      return renderFormularioEdicion();
    }

    return (
      <div>
        <h2>{pacienteSeleccionado.name}</h2>
        <div style={infoGridStyle}>
          {renderInfoItem('Especie', pacienteSeleccionado.species)}
          {renderInfoItem('Raza', pacienteSeleccionado.breed)}
          {renderInfoItem('Nacimiento / edad', etiquetaEdad(pacienteSeleccionado))}
          {renderInfoItem('Esterilizado', etiquetaEsterilizado(pacienteSeleccionado.is_sterilized))}
          {renderInfoItem('Dueño responsable', pacienteSeleccionado.owners.name)}
          {renderInfoItem('Teléfono', pacienteSeleccionado.owners.phone)}
          {renderInfoItem('Email', pacienteSeleccionado.owners.email)}
          {renderInfoItem('Dirección', pacienteSeleccionado.owners.address)}
        </div>

        <button type="button" onClick={activarEdicion} style={primaryButtonStyle}>
          Editar datos
        </button>
        <button
          type="button"
          onClick={() => setMostrarFormVisita(!mostrarFormVisita)}
          style={{ ...secondaryButtonStyle, marginLeft: '8px' }}
        >
          {mostrarFormVisita ? 'Cancelar atención' : '+ Atención'}
        </button>

        {mostrarFormVisita && renderFormularioAtencion()}

        <button
          type="button"
          onClick={() => setMostrarArchivar(!mostrarArchivar)}
          style={{ ...secondaryButtonStyle, marginTop: '16px', borderColor: '#d32f2f', color: '#d32f2f' }}
        >
          Archivar paciente
        </button>

        {mostrarArchivar && (
          <div style={{ marginTop: '16px', padding: '14px', border: '1px solid #d32f2f', backgroundColor: '#ffebee' }}>
            <p style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: 0 }}>
              Estás a punto de dar de baja a este paciente.
            </p>
            <label>
              Motivo
              <select value={motivoArchivo} onChange={(e) => setMotivoArchivo(e.target.value)} style={fieldStyle}>
                <option value="inactive_patient">Paciente inactivo / fallecido</option>
                <option value="duplicate_record">Registro duplicado</option>
                <option value="data_entry_error">Error de ingreso</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <button type="button" onClick={manejarArchivado} style={{ ...primaryButtonStyle, backgroundColor: '#d32f2f' }}>
              Confirmar archivado
            </button>
            <button type="button" onClick={() => setMostrarArchivar(false)} style={{ ...secondaryButtonStyle, marginLeft: '8px' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResumenPacienteAtencion = () => {
    if (!pacienteDesdeAtencion) {
      return <p style={emptyValueStyle}>El resumen del paciente aparecerá al seleccionar una atención.</p>;
    }

    return (
      <div>
        <h2>{pacienteDesdeAtencion.name}</h2>
        <div style={cardStyle}>
          {renderInfoItem('Especie', pacienteDesdeAtencion.species)}
          {renderInfoItem('Dueño', pacienteDesdeAtencion.owners.name)}
          {renderInfoItem('Teléfono', pacienteDesdeAtencion.owners.phone)}
        </div>
        <button type="button" onClick={abrirFichaDesdeAtencion} style={primaryButtonStyle}>
          Ver ficha
        </button>
      </div>
    );
  };

  const renderEdicionAtencion = () => (
    <form onSubmit={guardarEdicionAtencion} style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Editar atención</h3>
      <label>
        Fecha atención
        <input
          type="date"
          value={fechaAtencionEditada}
          onChange={(e) => setFechaAtencionEditada(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Motivo
        <input
          type="text"
          list="visit-reason-options"
          placeholder="Consulta, Vacuna, Peluquería u otro"
          value={motivoAtencionEditado}
          onChange={(e) => setMotivoAtencionEditado(e.target.value)}
          style={fieldStyle}
        />
      </label>
      <label>
        Observaciones
        <textarea
          value={observacionesAtencionEditadas}
          onChange={(e) => setObservacionesAtencionEditadas(e.target.value)}
          style={{ ...fieldStyle, minHeight: '160px' }}
        />
      </label>
      <button type="submit" style={primaryButtonStyle}>Guardar cambios</button>
      <button type="button" onClick={() => setModoEdicionAtencion(false)} style={{ ...secondaryButtonStyle, marginLeft: '8px' }}>
        Cancelar
      </button>
    </form>
  );

  const renderTabFichas = () => (
    <div style={workspaceGridStyle('340px 1fr 420px')}>
      <section style={panelStyle}>
        <h3>Fichas</h3>
        <button
          type="button"
          onClick={() => {
            const mostrarNuevaFicha = !mostrarForm;
            setFichaSeleccionada(null);
            setAtencionSeleccionada(null);
            setHistorialVisitas([]);
            resetearPaneles();
            if (mostrarNuevaFicha) {
              limpiarFormularioPaciente();
              limpiarFormularioAtencion();
            }
            setMostrarForm(mostrarNuevaFicha);
          }}
          style={{ ...primaryButtonStyle, width: '100%', marginBottom: '16px' }}
        >
          {mostrarForm ? 'Cancelar nueva ficha' : '+ Nueva ficha'}
        </button>

        <input
          type="text"
          placeholder="Buscar ficha..."
          value={busquedaFichas}
          onChange={(e) => setBusquedaFichas(e.target.value)}
          style={fieldStyle}
        />
        <button type="button" onClick={handleBuscarFichas} style={{ ...secondaryButtonStyle, width: '100%' }}>
          Buscar
        </button>

        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && fichas.length === 0 && <p style={emptyValueStyle}>Sin fichas</p>}

        {fichas.length > 0 && (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {fichas.map((ficha) => (
              <li key={ficha.id}>
                <button
                  type="button"
                  onClick={() => seleccionarFicha(ficha)}
                  style={listCardButtonStyle(fichaSeleccionada?.id === ficha.id)}
                >
                  <strong>{ficha.name}</strong>
                  <div style={mutedTextStyle}>{renderValor(ficha.species, 'Sin especie')}</div>
                  <div>{renderValor(ficha.owners.name, 'Sin dueño')}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={panelStyle}>
        {mostrarForm ? (
          renderFormularioFicha()
        ) : fichaSeleccionada ? (
          <>
            <h3>Ficha médica</h3>
            {renderDatosPaciente()}
          </>
        ) : (
          <>
            <h3>Ficha médica</h3>
            <p style={emptyValueStyle}>Selecciona una ficha de la lista o crea una ficha nueva.</p>
          </>
        )}
      </section>

      <section style={panelStyle}>
        <h3>Historial de atenciones</h3>
        {fichaSeleccionada ? (
          <>
            {historialVisitas.length === 0 ? (
              <p style={emptyValueStyle}>Este paciente no tiene atenciones previas.</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {historialVisitas.map((visita) => (
                  <li key={visita.id} style={cardStyle}>
                    <strong>{formatearFechaHumana(visita.visit_date)}</strong>
                    <div style={mutedTextStyle}>{visita.visit_date}</div>
                    <p><strong>Motivo:</strong> {renderValor(visita.reason, 'Sin motivo registrado')}</p>
                    <p><strong>Observaciones:</strong> {renderValor(visita.observations, 'Sin observaciones registradas')}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p style={emptyValueStyle}>El historial aparecerá al seleccionar una ficha.</p>
        )}
      </section>
    </div>
  );

  const renderTabAtenciones = () => (
    <div style={workspaceGridStyle('360px 1fr 360px')}>
      <section style={panelStyle}>
        <h3>Atenciones</h3>
        <button
          type="button"
          onClick={() => {
            setAtencionSeleccionada(null);
            setFichaSeleccionada(null);
            setHistorialVisitas([]);
            setMostrarForm(false);
            setMostrarFormVisita(true);
            setModoEdicion(false);
            setModoEdicionAtencion(false);
            setMostrarArchivar(false);
            limpiarFormularioAtencion();
            setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.set('tab', 'atenciones');
              next.set('newVisit', '1');
              next.delete('visit');
              next.delete('pet');
              return next;
            });
          }}
          style={{ ...primaryButtonStyle, width: '100%', marginBottom: '16px' }}
        >
          + Nueva atención
        </button>
        <input
          type="text"
          placeholder="Filtrar atenciones..."
          value={busquedaAtenciones}
          onChange={(e) => setBusquedaAtenciones(e.target.value)}
          style={fieldStyle}
        />
        <button type="button" onClick={handleBuscarAtenciones} style={{ ...secondaryButtonStyle, width: '100%' }}>
          Buscar
        </button>

        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && atenciones.length === 0 && <p style={emptyValueStyle}>Sin atenciones</p>}

        {atenciones.length > 0 && (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {atenciones.map((atencion) => (
              <li key={atencion.id}>
                <button
                  type="button"
                  onClick={() => seleccionarAtencion(atencion)}
                  style={listCardButtonStyle(atencionSeleccionada?.id === atencion.id)}
                >
                  <strong>{formatearFechaHumana(atencion.visit_date)}</strong>
                  <div style={mutedTextStyle}>{atencion.visit_date}</div>
                  <div>{atencion.pets.name} ({renderValor(atencion.pets.species, 'Sin especie')})</div>
                  <div>{renderValor(atencion.reason, 'Sin motivo registrado')}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={panelStyle}>
        {atencionSeleccionada ? (
          <div>
            <h3>Detalle de atención</h3>
            {modoEdicionAtencion ? (
              renderEdicionAtencion()
            ) : (
              <>
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0 }}>{formatearFechaHumana(atencionSeleccionada.visit_date)}</h2>
                  <p style={mutedTextStyle}>{atencionSeleccionada.visit_date}</p>
                  <div style={infoGridStyle}>
                    {renderInfoItem('Paciente', atencionSeleccionada.pets.name)}
                    {renderInfoItem('Motivo', atencionSeleccionada.reason)}
                  </div>
                  <p><strong>Observaciones:</strong></p>
                  <p>{renderValor(atencionSeleccionada.observations, 'Sin observaciones registradas')}</p>
                </div>
                <button type="button" onClick={() => cargarFormularioAtencionSeleccionada(atencionSeleccionada)} style={primaryButtonStyle}>
                  Editar atención
                </button>
                <button type="button" onClick={() => setMostrarFormVisita(!mostrarFormVisita)} style={{ ...secondaryButtonStyle, marginLeft: '8px' }}>
                  {mostrarFormVisita ? 'Cancelar nueva atención' : '+ Nueva atención para este paciente'}
                </button>
                {mostrarFormVisita && renderFormularioAtencion()}
              </>
            )}
          </div>
        ) : (
          <div>
            <h3>Detalle de atención</h3>
            {mostrarFormVisita ? (
              <>
                <p>Registra una nueva atención seleccionando primero el paciente.</p>
                {renderFormularioAtencion()}
              </>
            ) : (
              <p style={emptyValueStyle}>Selecciona una atención de la lista para ver su detalle o crea una nueva atención.</p>
            )}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h3>Paciente</h3>
        {renderResumenPacienteAtencion()}
      </section>
    </div>
  );

  return (
    <div style={appPageStyle}>
      <datalist id="species-options">
        {especiesSugeridas.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="visit-reason-options">
        {motivosSugeridos.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>

      {toast && (
        <div role="status" style={toastStyle}>
          {toast.message}
        </div>
      )}

      {tabActiva === "fichas" ? renderTabFichas() : renderTabAtenciones()}
    </div>
  )
}
