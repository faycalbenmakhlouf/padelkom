import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Messages <Text style={{color:COLORS.green}}>.</Text></Text></View>
      <View style={s.center}>
        <Text style={{fontSize:40,marginBottom:12}}>💬</Text>
        <Text style={s.emptyTitle}>Messagerie</Text>
        <Text style={s.emptySub}>Bientôt disponible !</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  header:{padding:SPACING.md},
  title:{fontSize:22,fontWeight:'900',color:COLORS.text},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  emptyTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:8},
  emptySub:{fontSize:14,color:COLORS.text2},
});
