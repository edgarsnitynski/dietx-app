import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title, Paragraph } from 'react-native-paper';

export default function HomeScreen({ navigation, route }) {
  const user = route.params?.user ?? { name: 'Nutricionista' };
  return (
    <View style={styles.container}>
      <Title>Olá, {user.name} 👋</Title>
      <Paragraph style={{marginBottom:20}}>Gerencie pacientes, planos e anotações.</Paragraph>
      <Button mode="contained" onPress={() => navigation.navigate('Patients')}>Ver Pacientes</Button>
      <Button style={{marginTop:8}} onPress={()=> navigation.navigate('Appointments')}>Agendamentos</Button>
      <Button style={{marginTop:8}} onPress={()=> navigation.navigate('Plans')}>Planos</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,alignItems:'center',justifyContent:'center',padding:20}
});
