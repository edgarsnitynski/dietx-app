import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PatientsScreen from './src/screens/PatientsScreen';
import PatientDetail from './src/screens/PatientDetail';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import PlansScreen from './src/screens/PlansScreen';
import AnthropometryScreen from './src/screens/AnthropometryScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import ProtocolsScreen from './src/screens/ProtocolsScreen';
import PatientPortalScreen from './src/screens/PatientPortalScreen';

const Stack = createNativeStackNavigator();

export default function App(): JSX.Element {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Patients" component={PatientsScreen} options={{ title: 'Pacientes' }} />
          <Stack.Screen name="PatientDetail" component={PatientDetail} options={{ title: 'Paciente' }} />
          <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Agendamentos' }} />
          <Stack.Screen name="Plans" component={PlansScreen} options={{ title: 'Planos' }} />
          <Stack.Screen name="Anthropometry" component={AnthropometryScreen} options={{ title: 'Antropometria' }} />
          <Stack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Fotos' }} />
          <Stack.Screen name="Protocols" component={ProtocolsScreen} options={{ title: 'Protocolos' }} />
          <Stack.Screen name="PatientPortal" component={PatientPortalScreen} options={{ title: 'Portal do Paciente' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
