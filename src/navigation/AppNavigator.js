import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { View, ActivityIndicator } from 'react-native';
import EmotionalTestScreen from '../screens/EmotionalTestScreen';
import TestHistoryScreen from '../screens/TestHistoryScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminStatsScreen from '../screens/AdminStatsScreen';


import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PsychologistsScreen from '../screens/PsychologistsScreen';
import BookingScreen from '../screens/BookingScreen';
import SessionsScreen from '../screens/SessionsScreen';
import EmergencyChatScreen from '../screens/EmergencyChatScreen';
import PsyHomeScreen from '../screens/PsyHomeScreen';
import PsySessionsScreen from '../screens/PsySessionsScreen';
import PsyEmergencyChatScreen from '../screens/PsyEmergencyChatScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(undefined);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

if (snap.exists()) {
const data = snap.data();
setRole(data?.role || 'patient');} else {
  setRole('patient');
}

setUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
      }
    });
    return unsub;
  }, []);

  if (user === undefined || (user && role === null)) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" color="#5B2D8E" />
    </View>
  );
}

  return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
  
          {!user ? (
            // 🔐 AUTH
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          ) : role === 'admin' ? (
            // 👨‍💼 ADMIN
            <>
              <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
              <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
              <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
            </>
          ) : role === 'psychologist' ? (
            // 👩‍⚕️ PSYCHOLOGIST
            <>
              <Stack.Screen name="PsyHome" component={PsyHomeScreen} />
              <Stack.Screen name="PsySessions" component={PsySessionsScreen} />
              <Stack.Screen name="PsyEmergencyChat" component={PsyEmergencyChatScreen} />
            </>
          ) : (
            // 🧑‍⚕️ PATIENT
            <>
              <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
              <Stack.Screen name="Psychologists" component={PsychologistsScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="Sessions" component={SessionsScreen} />
              <Stack.Screen name="EmergencyChat" component={EmergencyChatScreen} />
              <Stack.Screen name="EmotionalTest" component={EmotionalTestScreen} />
              <Stack.Screen name="TestHistory" component={TestHistoryScreen} />
              <Stack.Screen name="VideoCall" component={VideoCallScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          )}
  
        </Stack.Navigator>
      </NavigationContainer>
    );
}