import React, {useState} from 'react';
import { ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PATIENTS_v1';

async function loadPatients(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }
async function savePatients(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function AnthropometryScreen({ route }){
  const { patientId } = route.params ?? {};
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [biceps, setBiceps] = useState('');
  const [triceps, setTriceps] = useState('');
  const [subscapular, setSubscapular] = useState('');

  async function save(){
    if(!patientId) return Alert.alert('Paciente inválido');
    const list = await loadPatients();
    const idx = list.findIndex(x=>x.id===patientId);
    if(idx<0) return Alert.alert('Paciente não encontrado');
    const measures = { waist, hip, biceps, triceps, subscapular, date: new Date().toISOString() };
    list[idx].anthropometry = measures;
    await savePatients(list);
    Alert.alert('Medidas salvas');
  }

  return (
    <ScrollView style={{padding:12}}>
      <Card>
        <Card.Content>
          <Paragraph>Medidas por fita e adipômetro</Paragraph>
          <TextInput label="Cintura (cm)" value={waist} onChangeText={setWaist} keyboardType="numeric" />
          <TextInput label="Quadril (cm)" value={hip} onChangeText={setHip} keyboardType="numeric" />
          <TextInput label="Bíceps (cm)" value={biceps} onChangeText={setBiceps} keyboardType="numeric" />
          <TextInput label="Tríceps (mm adipômetro)" value={triceps} onChangeText={setTriceps} keyboardType="numeric" />
          <TextInput label="Subescapular (mm adipômetro)" value={subscapular} onChangeText={setSubscapular} keyboardType="numeric" />
          <Button mode="contained" onPress={save} style={{marginTop:8}}>Salvar antropometria</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
