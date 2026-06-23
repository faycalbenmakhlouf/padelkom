import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { supabase } from '../config/supabase';

export default function ChatScreen({ navigation, route }) {
  const { destinataireId, destinataireNom, matchId } = route.params;
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setUserId(session.user.id);
    await chargerMessages(session.user.id);
    await marquerLus(session.user.id);
  };

  const chargerMessages = async (uid) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(expediteur_id.eq.${uid},destinataire_id.eq.${destinataireId}),and(expediteur_id.eq.${destinataireId},destinataire_id.eq.${uid})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  const marquerLus = async (uid) => {
    await supabase.from('conversations').update({ lu: true })
      .eq('destinataire_id', uid)
      .eq('expediteur_id', destinataireId)
      .eq('lu', false);
  };

  const envoyer = async () => {
    if (!texte.trim() || !userId) return;
    setSending(true);
    const { data } = await supabase.from('conversations').insert({
      expediteur_id: userId,
      destinataire_id: destinataireId,
      match_id: matchId || null,
      contenu: texte.trim(),
    }).select().single();
    if (data) setMessages(m => [...m, data]);
    setTexte('');
    setSending(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatHeure = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderMessage = ({ item }) => {
    const isMe = item.expediteur_id === userId;
    return (
      <View style={[s.msgWrap, isMe ? s.msgWrapMe : s.msgWrapOther]}>
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
          <Text style={[s.msgText, isMe ? s.msgTextMe : s.msgTextOther]}>{item.contenu}</Text>
          <Text style={[s.msgTime, isMe ? s.msgTimeMe : s.msgTimeOther]}>{formatHeure(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <View style={s.topCenter}>
          <Text style={s.topNom}>{destinataireNom}</Text>
          {matchId && <Text style={s.topMatch}>Match #{matchId}</Text>}
        </View>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.green} size="large" /></View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: SPACING.md, paddingBottom: 8 }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>💬</Text>
                <Text style={s.emptyText}>Commence la conversation !</Text>
              </View>
            }
          />
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={texte}
              onChangeText={setTexte}
              placeholder="Écris un message…"
              placeholderTextColor={COLORS.text2}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={[s.sendBtn, (!texte.trim() || sending) && { opacity: 0.4 }]} onPress={envoyer} disabled={!texte.trim() || sending} activeOpacity={0.8}>
              {sending ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.sendIcon}>➤</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 70 },
  backText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  topCenter: { alignItems: 'center' },
  topNom: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  topMatch: { fontSize: 11, color: COLORS.text2, marginTop: 2 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: COLORS.text2 },
  msgWrap: { marginBottom: 8 },
  msgWrapMe: { alignItems: 'flex-end' },
  msgWrapOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10, paddingHorizontal: 13 },
  bubbleMe: { backgroundColor: COLORS.green, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: '#000', fontWeight: '500' },
  msgTextOther: { color: COLORS.text },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(0,0,0,0.5)' },
  msgTimeOther: { color: COLORS.text2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, backgroundColor: COLORS.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 16, color: '#000', fontWeight: '800' },
});
