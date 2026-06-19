import { supabase } from '../config/supabase';

export async function inscrire({ email, motDePasse, prenom, nom, genre, dateNaissance, ville, quartier, licenceFRMT }) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) throw error;
    await supabase.from('profiles').insert({
      id: data.user.id, prenom, nom, genre,
      date_naissance: dateNaissance, ville, quartier,
      licence_frmt: licenceFRMT || null, niveau: 1, note_moyenne: 0, matchs_joues: 0,
    });
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function connecter({ email, motDePasse }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deconnecter() {
  await supabase.auth.signOut();
}
