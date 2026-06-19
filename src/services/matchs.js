import { supabase } from '../config/supabase';

export async function creerMatch({ createurId, jour, heure, club, typeMatch, niveau, placesTotal, ville }) {
  try {
    const { data, error } = await supabase.from('matchs').insert({
      createur_id: createurId, jour, heure, club,
      type_match: typeMatch, niveau,
      places_total: placesTotal, places_libres: placesTotal,
      statut: 'ouvert', ville,
    }).select().single();
    if (error) throw error;
    return { success: true, match: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
