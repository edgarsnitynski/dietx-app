import React, {useState, useEffect} from 'react';
import { View, FlatList, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PLANS_v1';

const TEMPLATE_MEALS = [
  { name:'Café da manhã', items:['Pão integral 2 fatias', 'Queijo cottage 30g', 'Fruta (banana)'] },
  { name:'Lanche manhã', items:['Iogurte natural 170g', 'Granola 30g'] },
  { name:'Almoço', items:['Arroz 100g', 'Feijão 100g', 'Frango grelhado 120g', 'Salada à vontade'] },
  { name:'Lanche tarde', items:['Vitamina de frutas com proteína'] },
  { name:'Jantar', items:['Peixe 120g', 'Legumes cozidos', 'Salada'] }
];

async function load(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }
async function save(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function PlansScreen(){
  const [plans, setPlans] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(()=>{ (async ()=> setPlans(await load()))(); }, []);

  async function createPlan(){
    if(!title.trim()) return Alert.alert('Título obrigatório');
    const next = [{ id: Date.now().toString(), title: title.trim(), meals: TEMPLATE_MEALS }, ...plans];
    setPlans(next); await save(next); setTitle('');
  }

  async function remove(id){ const next = plans.filter(p=>p.id!==id); setPlans(next); await save(next); }

  return (
    <View style={{flex:1}}>
      <Card style={{margin:8}}>
        <Card.Content>
          <TextInput label="Título do plano" value={title} onChangeText={setTitle} />
          <Button mode="contained" onPress={createPlan} style={{marginTop:8}}>Criar plano com cardápio pronto</Button>
        </Card.Content>
      </Card>

      <FlatList data={plans} keyExtractor={i=>i.id} renderItem={({item})=> (
        <Card style={{margin:8}} key={item.id}>
          <Card.Content>
            <Title>{item.title}</Title>
            <Paragraph>Refeições: {item.meals.length}</Paragraph>
            <Button onPress={()=> Alert.alert('Visualizar plano', JSON.stringify(item.meals,null,2))}>Visualizar</Button>
            <Button onPress={()=> remove(item.id)} mode="outlined">Remover</Button>
          </Card.Content>
        </Card>
      )} />
    </View>
  );
}
