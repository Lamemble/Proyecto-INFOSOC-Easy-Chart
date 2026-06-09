import { supabase } from "../utils/supabase";

export async function buscarDuenniosyMascotas(search) {
  const q = search.trim();
  if (!q) return [];

  // 1. Buscamos si el texto coincide con la mascota
  const { data: mascotas, error: errMascotas } = await supabase
    .from("pets")
    .select(`
      id,
      name,
      species,
      breed,
      owners!inner(
        id,
        name,
        phone
      )
    `)
    .is("archived_at", null)
    .is("owners.archived_at", null)
    .or(`name.ilike.%${q}%,species.ilike.%${q}%,breed.ilike.%${q}%`);

  if (errMascotas) throw errMascotas;

  // 2. Buscamos si el texto coincide con el dueño
  const { data: duenos, error: errDuenos } = await supabase
    .from("pets")
    .select(`
      id,
      name,
      species,
      breed,
      owners!inner(
        id,
        name,
        phone
      )
    `)
    .is("archived_at", null)
    .is("owners.archived_at", null)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`, { foreignTable: "owners" });

  if (errDuenos) throw errDuenos;

  // 3. Unimos ambas listas de resultados
  const todosLosResultados = [...mascotas, ...duenos];

  // 4. Eliminamos los duplicados (por si el dueño y la mascota tienen nombres similares)
  const resultadosUnicos = Array.from(new Map(todosLosResultados.map(p => [p.id, p])).values());

  // 5. Ordenamos por nombre alfabéticamente
  return resultadosUnicos.sort((a, b) => a.name.localeCompare(b.name));
}