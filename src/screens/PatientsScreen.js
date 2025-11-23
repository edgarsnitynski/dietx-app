import React, { useEffect, useState } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { FAB, List, TextInput, Button } from 'react-native-paper';

// For starter we use local storage; replace with Firestore integration
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PATIENTS_v1';

async function loadPatients(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[]; }catch(e){return[];} }
async function savePatients(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function PatientsScreen({ navigation }){
  const [patients, setPatients] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{ (async ()=> setPatients(await loadPatients()))(); }, []);

  async function addPatient(){
    if(!name.trim()) return Alert.alert('Nome obrigatório');
    const newP = { id: Date.now().toString(), name: name.trim(), createdAt: new Date().toISOString(), notes:[], measures:[] };
    const next = [newP, ...patients];
    setPatients(next);
    await savePatients(next);
    setName('');
  }

  async function removePatient(id){
    const next = patients.filter(p=>p.id!==id);
    setPatients(next);
    await savePatients(next);
  }

  return (
    <View style={{flex:1}}>
      <View style={{padding:10}}>
        <TextInput label="Nome do paciente" value={name} onChangeText={setName} />
        <Button mode="contained" onPress={addPatient} style={{marginTop:8}}>Adicionar paciente</Button>
      </View>

      <FlatList data={patients} keyExtractor={i=>i.id} renderItem={({item})=> (
        <List.Item
          title={item.name}
          description={`Criado: ${new Date(item.createdAt).toLocaleDateString()}`}
          onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
          right={props => <List.Icon {...props} icon="delete" onPress={()=> removePatient(item.id)} />}
        />
      )} />
    </View>
  );
}
