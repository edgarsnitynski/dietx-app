import React, {useState} from 'react';
import { ScrollView, Image } from 'react-native';
import { Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export default function PhotosScreen({ route }){
  const { patientId } = route.params ?? {};
  const [photos, setPhotos] = useState([]);

  async function pick(){
    const res = await ImagePicker.launchImageLibraryAsync({ quality:0.6, allowsEditing:true });
    if(res.cancelled) return;
    setPhotos(p=>[...p, res.uri]);
  }

  return (
    <ScrollView style={{padding:12}}>
      <Button mode="contained" onPress={pick}>Adicionar foto</Button>
      {photos.map((u,i)=> (
        <Card key={i} style={{marginTop:8}}>
          <Card.Content>
            <Image source={{uri:u}} style={{width:'100%',height:200}} />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}
