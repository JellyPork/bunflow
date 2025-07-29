import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeDatabase } from '@/lib/database';
import { useEffect } from 'react';
import { create } from 'zustand';

// Theme store for global theme selection
type ThemeType = 'system' | 'light' | 'dark';
interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}
export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { theme } = useThemeStore();
  useEffect(() => {
    initializeDatabase();
  }, []);
  if (!loaded) {
    return null;
  }
  // Determine theme
  let selectedTheme = DefaultTheme;
  if (theme === 'dark' || (theme === 'system' && colorScheme === 'dark')) {
    selectedTheme = DarkTheme;
  }
  return (
    <ThemeProvider value={selectedTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
