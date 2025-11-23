import React, {useState, useEffect} from 'react';
import { View, FlatList, Alert } from 'react-native';
import { Button, List, TextInput, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_APPOINTMENTS_v1';

async function load(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }
async function save(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function AppointmentsScreen(){
  const [appointments, setAppointments] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  useEffect(()=>{ (async ()=> setAppointments(await load()))(); }, []);

  async function addAppointment(){
    if(!title||!date) return Alert.alert('Preencha título e data');
    const next = [{ id: Date.now().toString(), title, date }, ...appointments];
    setAppointments(next);
    await save(next);
    setTitle(''); setDate('');
  }

  async function remove(id){
    const next = appointments.filter(a=>a.id!==id);
    setAppointments(next);
    await save(next);
  }

  return (
    <View style={{flex:1}}>
      <Card style={{margin:8}}>
        <Card.Content>
          <TextInput label="Título" value={title} onChangeText={setTitle} />
          <TextInput label="Data / Hora" value={date} onChangeText={setDate} />
          <Button mode="contained" onPress={addAppointment} style={{marginTop:8}}>Agendar</Button>
        </Card.Content>
      </Card>

      <FlatList data={appointments} keyExtractor={i=>i.id} renderItem={({item})=> (
        <List.Item title={item.title} description={item.date} right={()=><List.Icon icon="delete" onPress={()=>remove(item.id)} />} />
      )} />
    </View>
  );
}
