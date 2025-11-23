import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Title, Paragraph, TextInput, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PATIENTS_v1';

function calculateBMI(weightKg, heightCm){
  if(!weightKg || !heightCm) return null;
  const h = heightCm/100;
  const bmi = weightKg/(h*h);
  return Math.round(bmi*10)/10;
}

function bmrMifflin(gender, weightKg, heightCm, age){
  if(!weightKg || !heightCm || !age) return null;
  const s = gender === 'female' ? -161 : 5;
  const bmr = 10*weightKg + 6.25*heightCm - 5*age + s;
  return Math.round(bmr);
}

async function loadPatients(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[]; }catch(e){return[];} }
async function savePatients(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function PatientDetail({ route, navigation }){
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [note, setNote] = useState('');

  useEffect(()=>{ (async ()=>{
    const list = await loadPatients();
    const p = list.find(x=>x.id===patientId);
    if(!p) { Alert.alert('Paciente não encontrado'); navigation.goBack(); return; }
    setPatient(p);
    if(p.latestMeasure){ setWeight(String(p.latestMeasure.weight)); setHeight(String(p.latestMeasure.height)); setAge(String(p.latestMeasure.age||'')); setGender(p.latestMeasure.gender||'male'); }
  })(); },[]);

  async function saveNote(){
    if(!note.trim()) return;
    const list = await loadPatients();
    const idx = list.findIndex(x=>x.id===patientId);
    list[idx].notes = list[idx].notes || [];
    list[idx].notes.unshift({ id: Date.now().toString(), text: note.trim(), date: new Date().toISOString() });
    await savePatients(list);
    setPatient(list[idx]);
    setNote('');
  }

  async function saveMeasure(){
    const w = parseFloat(weight.replace(',','.'));
    const h = parseFloat(height.replace(',','.'));
    const a = parseInt(age) || 0;
    const measure = { weight:w, height:h, age:a, gender, date: new Date().toISOString() };
    const list = await loadPatients();
    const idx = list.findIndex(x=>x.id===patientId);
    list[idx].latestMeasure = measure;
    list[idx].measures = list[idx].measures || [];
    list[idx].measures.unshift(measure);
    await savePatients(list);
    setPatient(list[idx]);
    Alert.alert('Medida salva');
  }

  if(!patient) return null;

  const bmi = calculateBMI(patient.latestMeasure?.weight, patient.latestMeasure?.height);
  const bmr = bmrMifflin(patient.latestMeasure?.gender, patient.latestMeasure?.weight, patient.latestMeasure?.height, patient.latestMeasure?.age);

  return (
    <ScrollView style={{padding:12}}>
      <Title>{patient.name}</Title>
      <Card style={{marginVertical:8}}>
        <Card.Content>
          <Paragraph>IMC: {bmi ?? '-'}{bmi ? ` — ${bmi < 18.5 ? 'Abaixo' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidade'}` : ''}</Paragraph>
          <Paragraph>TMB estimada: {bmr ?? '-' } kcal/dia</Paragraph>
        </Card.Content>
      </Card>

      <Card style={{marginVertical:8}}>
        <Card.Content>
          <Paragraph style={{fontWeight:'600'}}>Registrar medida</Paragraph>
          <TextInput label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
          <TextInput label="Altura (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
          <TextInput label="Idade" value={age} onChangeText={setAge} keyboardType="numeric" />
          <TextInput label="Gênero (male/female)" value={gender} onChangeText={setGender} />
          <Button mode="contained" onPress={saveMeasure} style={{marginTop:8}}>Salvar medida</Button>
        </Card.Content>
      </Card>

      <Card style={{marginVertical:8}}>
        <Card.Content>
          <Paragraph style={{fontWeight:'600'}}>Anotações</Paragraph>
          <TextInput label="Nova anotação" value={note} onChangeText={setNote} multiline />
          <Button mode="contained" onPress={saveNote} style={{marginTop:8}}>Adicionar</Button>

          {patient.notes?.map(n=> (
            <Card key={n.id} style={{marginTop:8}}>
              <Card.Content>
                <Paragraph>{n.text}</Paragraph>
                <Paragraph style={{fontSize:12,color:'#666'}}>{new Date(n.date).toLocaleString()}</Paragraph>
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>

    </ScrollView>
  );
}
