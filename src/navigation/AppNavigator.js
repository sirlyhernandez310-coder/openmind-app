import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

// SPLASH
import SplashScreen from '../screens/SplashScreen';

// AUTH
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// ADMIN
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminStatsScreen from '../screens/AdminStatsScreen';

// PACIENTE
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PsychologistsScreen from '../screens/PsychologistsScreen';
import BookingScreen from '../screens/BookingScreen';
import SessionsScreen from '../screens/SessionsScreen';
import EmergencyChatScreen from '../screens/EmergencyChatScreen';
import EmotionalTestScreen from '../screens/EmotionalTestScreen';
import TestHistoryScreen from '../screens/TestHistoryScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PatientClinicalHistoryScreen from '../screens/PatientClinicalHistoryScreen';

// PSICÓLOGO
import PsyHomeScreen from '../screens/PsyHomeScreen';
import PsySessionsScreen from '../screens/PsySessionsScreen';
import PsyEmergencyChatScreen from '../screens/PsyEmergencyChatScreen';
import ClinicalHistoryScreen from '../screens/ClinicalHistoryScreen';
import ClinicalHistoryDetailScreen from '../screens/ClinicalHistoryDetailScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser]             = useState(undefined);
  const [role, setRole]             = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setRole(snap.data()?.role || 'patient');
          } else {
            setRole('patient');
          }
          setUser(firebaseUser);
        } catch (error) {
          console.log('Error obteniendo rol:', error);
          setRole('patient');
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });
    return unsubscribe;
  }, []);

  // Splash screen — se muestra mientras carga auth
  if (showSplash) {
    return (
      <SplashScreen
        onDone={() => setShowSplash(false)}
      />
    );
  }

  // Loading mientras Firebase verifica sesión
  if (user === undefined || (user && role === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator size="large" color={colors.lilac} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {!user ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : role === 'admin' ? (
          <>
            <Stack.Screen name="AdminHome"  component={AdminHomeScreen} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
          </>
        ) : role === 'psychologist' ? (
          <>
            <Stack.Screen name="PsyHome"              component={PsyHomeScreen} />
            <Stack.Screen name="PsySessions"          component={PsySessionsScreen} />
            <Stack.Screen name="PsyEmergencyChat"     component={PsyEmergencyChatScreen} />
            <Stack.Screen name="ClinicalHistory"      component={ClinicalHistoryScreen} />
            <Stack.Screen name="ClinicalHistoryDetail"component={ClinicalHistoryDetailScreen} />
            <Stack.Screen name="VideoCall"            component={VideoCallScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PatientHome"            component={PatientHomeScreen} />
            <Stack.Screen name="Psychologists"          component={PsychologistsScreen} />
            <Stack.Screen name="Booking"                component={BookingScreen} />
            <Stack.Screen name="Sessions"               component={SessionsScreen} />
            <Stack.Screen name="EmergencyChat"          component={EmergencyChatScreen} />
            <Stack.Screen name="EmotionalTest"          component={EmotionalTestScreen} />
            <Stack.Screen name="TestHistory"            component={TestHistoryScreen} />
            <Stack.Screen name="VideoCall"              component={VideoCallScreen} />
            <Stack.Screen name="Profile"                component={ProfileScreen} />
            <Stack.Screen name="PatientClinicalHistory" component={PatientClinicalHistoryScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}