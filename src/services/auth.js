import { supabase } from '../config/supabase';

export async function inscrire({ email, motDePasse, prenom, nom, genre, dateNaissance, ville, quartier, licenceFRMT }) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) throw error;
    const userId = data.user?.id || data.session?.user?.id;
    if (!userId) throw new Error('Impossible de récupérer l\'identifiant utilisateur.');
    let dateFormatee = null;
    if (dateNaissance) {
      const parts = dateNaissance.split('/');
      if (parts.length === 3) dateFormatee = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId, prenom, nom, genre,
      date_naissance: dateFormatee, ville, quartier,
      licence_frmt: licenceFRMT || null, niveau: 1, note_moyenne: 0, matchs_joues: 0,
    });
    if (profileError) throw profileError;
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
