import { useEffect } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
  Geist_900Black,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Applies the loaded Geist font to every <Text> in the app by default, matching
// the web app's global `font-family: var(--font-geist-sans)` on <body>.
function applyDefaultFont() {
  const anyText = Text as any;
  const existingStyle = anyText.defaultProps?.style;
  anyText.defaultProps = {
    ...anyText.defaultProps,
    style: [{ fontFamily: 'Geist_400Regular' }, existingStyle],
  };
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    Geist_900Black,
    GeistMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.foreground,
          headerTitleStyle: {
            fontFamily: 'Geist_700Bold',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="analysis-report"
          options={{
            title: 'Analysis Report',
            headerShown: true
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
