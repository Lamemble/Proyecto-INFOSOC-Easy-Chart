import { supabase } from "../utils/supabase";

export async function buscarDuenniosyMascotas(search) {
  const q = search.trim();

  if (!q) return [];

  const { data, error } = await supabase
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
    .or(`name.ilike.%${q}%,species.ilike.%${q}%,breed.ilike.%${q}%`)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`, { foreignTable: "owners" })
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
