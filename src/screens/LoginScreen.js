import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';

export default function LoginScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    // placeholder - integrate with Firebase Auth
    navigation.replace('Home', { user: { name: name || 'Nutricionista' } });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.box}>
        <Title style={{textAlign:'center'}}>DietX</Title>
        <TextInput label="Seu nome" value={name} onChangeText={setName} style={{marginTop:20}} />
        <TextInput label="Email" value={email} onChangeText={setEmail} style={{marginTop:10}} />
        <TextInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry style={{marginTop:10}} />
        <Button mode="contained" onPress={handleLogin} style={{marginTop:20}}>Entrar</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,justifyContent:'center',alignItems:'center'},
  box:{width:'90%',padding:20}
});
