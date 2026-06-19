import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';

export default function TournoisScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Tournois <Text style={{color:COLORS.green}}>.</Text></Text></View>
      <View style={s.center}>
        <Text style={{fontSize:40,marginBottom:12}}>🏆</Text>
        <Text style={s.emptyTitle}>Cherche binôme</Text>
        <Text style={s.emptySub}>Bientôt disponible !</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.dark},
  header:{padding:SPACING.md},
  title:{fontSize:22,fontWeight:'900',color:COLORS.dark.text},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  emptyTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:8},
  emptySub:{fontSize:14,color:COLORS.text2},
});
