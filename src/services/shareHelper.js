import * as MailComposer from 'expo-mail-composer';
import { Linking, Alert } from 'react-native';

export function shareToWhatsApp(phone, text){
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  Linking.openURL(url).catch(()=> Alert.alert('Erro ao abrir WhatsApp'));
}

export async function shareToEmail(to, subject, body){
  const isAvailable = await MailComposer.isAvailableAsync();
  if(isAvailable){
    MailComposer.composeAsync({ recipients:[to], subject, body });
  }else{
    Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
}
