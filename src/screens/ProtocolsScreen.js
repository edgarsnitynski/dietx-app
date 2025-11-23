import React, {useState, useEffect} from 'react';
import { View, FlatList } from 'react-native';
import { Card, Button, Title, Paragraph, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'DIETX_PROTOCOLS_v1';

async function load(){ try{ const raw = await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):[] }catch(e){return[]} }
async function save(list){ try{ await AsyncStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }

export default function ProtocolsScreen(){
  const [protocols, setProtocols] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(()=>{ (async ()=> setProtocols(await load()))(); }, []);

  async function create(){
    if(!title.trim()||!content.trim()) return;
    const next = [{ id: Date.now().toString(), title: title.trim(), content: content.trim() }, ...protocols];
    setProtocols(next); await save(next); setTitle(''); setContent('');
  }

  async function remove(id){ const next = protocols.filter(p=>p.id!==id); setProtocols(next); await save(next); }

  return (
    <View style={{flex:1}}>
      <Card style={{margin:8}}>
        <Card.Content>
          <TextInput label="Título" value={title} onChangeText={setTitle} />
          <TextInput label="Conteúdo" value={content} onChangeText={setContent} multiline />
          <Button mode="contained" onPress={create} style={{marginTop:8}}>Criar protocolo</Button>
        </Card.Content>
      </Card>

      <FlatList data={protocols} keyExtractor={i=>i.id} renderItem={({item})=> (
        <Card style={{margin:8}} key={item.id}>
          <Card.Content>
            <Title>{item.title}</Title>
            <Paragraph numberOfLines={3}>{item.content}</Paragraph>
            <Button onPress={()=> alert(item.content)}>Abrir</Button>
            <Button mode="outlined" onPress={()=> remove(item.id)}>Remover</Button>
          </Card.Content>
        </Card>
      )} />
    </View>
  );
}
