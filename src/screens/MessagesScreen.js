import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { if (userId) charger(userId); });
    return unsub;
  }, [navigation, userId]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    setUserId(session.user.id);
    await charger(session.user.id);
  };

  const charger = async (uid) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`expediteur_id.eq.${uid},destinataire_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) { setConversations([]); setLoading(false); return; }

    const autreIds = [...new Set(data.map(m => m.expediteur_id === uid ? m.destinataire_id : m.expediteur_id))];
    const { data: profils } = await supabase.from('profiles').select('id, prenom, nom, genre').in('id', autreIds);
    const profilsMap = {};
    (profils || []).forEach(p => { profilsMap[p.id] = p; });

    const convMap = {};
    data.forEach(msg => {
      const autreId = msg.expediteur_id === uid ? msg.destinataire_id : msg.expediteur_id;
      if (!convMap[autreId]) {
        convMap[autreId] = { ...msg, autreId, profil: profilsMap[autreId], nonLus: 0 };
      }
      if (!msg.lu && msg.destinataire_id === uid) convMap[autreId].nonLus++;
    });

    setConversations(Object.values(convMap));
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `${diff}min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      ) : conversations.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
          <Text style={s.emptyTitle}>Aucune conversation</Text>
          <Text style={s.emptySub}>Rejoins un match pour commencer à discuter.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.autreId)}
          renderItem={({ item }) => {
            const p = item.profil;
            const nom = p ? `${p.prenom || ''} ${p.nom ? p.nom[0] + '.' : ''}`.trim() : 'Joueur';
            return (
              <TouchableOpacity
                style={s.convRow}
                onPress={() => navigation.navigate('Chat', { destinataireId: item.autreId, destinataireNom: nom, matchId: item.match_id })}
                activeOpacity={0.8}
              >
                <View style={s.avatar}>
                  <Text style={{ fontSize: 22 }}>{p?.genre === 'Joueuse' ? '👩' : '👨'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.convNom}>{nom}</Text>
                  <Text style={s.convDernier} numberOfLines={1}>{item.contenu}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={s.convTime}>{formatDate(item.created_at)}</Text>
                  {item.nonLus > 0 && (
                    <View style={s.badge}><Text style={s.badgeText}>{item.nonLus}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center' },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  convNom: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  convDernier: { fontSize: 13, color: COLORS.text2 },
  convTime: { fontSize: 11, color: COLORS.text2 },
  badge: { backgroundColor: COLORS.green, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#000' },
});
