import React, {useEffect, useState} from 'react';
import { View } from 'react-native';
import { Title, Card, Paragraph, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PATIENTS_v1';

async function loadPatients(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }

export default function PatientPortalScreen({ route }){
  const { patientId } = route.params ?? {};
  const [patient, setPatient] = useState(null);

  useEffect(()=>{ (async ()=>{ if(!patientId) return; const list = await loadPatients(); const p = list.find(x=>x.id===patientId); if(p) setPatient(p); })(); },[]);

  if(!patient) return null;

  return (
    <View style={{flex:1,padding:12}}>
      <Title>{patient.name}</Title>
      <Card style={{marginTop:8}}>
        <Card.Content>
          <Paragraph>Objetivos: {patient.goals || '-'}</Paragraph>
          <Paragraph>Planos: {patient.plans?.length || 0}</Paragraph>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={()=> {/* enviar dúvida */}}>Enviar dúvida</Button>
    </View>
  );
}
