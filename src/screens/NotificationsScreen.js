import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function NotificationsScreen({ navigation, route }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerNotifs();
  }, []);

  const chargerNotifs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setNotifs(data || []);
    await supabase.from('notifications').update({ lu: true }).eq('user_id', session.user.id).eq('lu', false);
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  };

  const icons = { nouveau_joueur: '🎾', match_confirme: '✅', match_annule: '❌' };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 70 }} />
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      ) : notifs.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
          <Text style={s.emptyTitle}>Aucune notification</Text>
          <Text style={s.emptySub}>Tu seras alerté quand quelqu'un rejoint ton match.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifs.map(n => (
            <View key={n.id} style={[s.notif, !n.lu && s.notifUnread]}>
              <View style={s.iconWrap}>
                <Text style={{ fontSize: 20 }}>{icons[n.type] || '🔔'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.message}>{n.message}</Text>
                <Text style={s.time}>{formatDate(n.created_at)}</Text>
              </View>
              {!n.lu && <View style={s.unreadDot} />}
            </View>
            {n.type === 'nouveau_joueur' && n.match_id && (
              <TouchableOpacity style={s.voirBtn} onPress={() => navigation.navigate('Demandes', { matchId: n.match_id })}>
                <Text style={s.voirBtnText}>Voir les demandes →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text2, textAlign: 'center' },
  notif: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  notifUnread: { backgroundColor: 'rgba(200,245,74,0.04)' },
  iconWrap: { width: 44, height: 44, backgroundColor: COLORS.card, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  message: { fontSize: 14, color: COLORS.text, fontWeight: '500', marginBottom: 4, lineHeight: 20 },
  time: { fontSize: 11, color: COLORS.text2 },
  unreadDot: { width: 8, height: 8, backgroundColor: COLORS.green, borderRadius: 4 },
  voirBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(200,245,74,0.1)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(200,245,74,0.2)', alignSelf: 'flex-start', marginLeft: 56 },
  voirBtnText: { fontSize: 12, color: COLORS.green, fontWeight: '700' },
});
