import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeDatabase } from '@/lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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
  console.log("App starting: global error handler set");
  console.log("Dev Build");
  if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error("Global error:", error, "Fatal:", isFatal);
    });
  }

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { theme, setTheme } = useThemeStore();
  const [dbReady, setDbReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    
    async function setup() {
      try {
        await initializeDatabase();
        setDbReady(true);
        console.log("Database initialized successfully");
        Notifications.requestPermissionsAsync().then(({ status }) => {
          if (status === 'granted') {
            console.log("Notification permissions granted");
          } else {
            console.log("Notification permissions denied");
          }
        });
      } catch (e) {
        console.error("Database initialization failed:", e);
      }
    }
    setup();

    
  }, []);
  
  useEffect(() => {
    (async () => {
      const themePrefStored = await AsyncStorage.getItem('themePreference');
      if (themePrefStored === 'light' || themePrefStored === 'dark' || themePrefStored === 'system') {
        setTheme(themePrefStored);
      }
      // Optionally load notification preference here as well
      const notifPref = await AsyncStorage.getItem('notificationsEnabled');
      if (notifPref !== null) {
        console.log("Notification preference loaded:", notifPref);
        setNotificationsEnabled(notifPref === 'true');
      }
    })();
  }, []);
  useEffect(() => {
    // Set up notification channel for Android
    if (notificationsEnabled) {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      console.log("Notification channel set up");
    }
  }, []);

  if (!loaded || !dbReady) {
    console.log("App not ready: fonts or database not loaded");
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

// Schedule a notification
export async function scheduleReminderNotification(
  taskTitle: string,
  triggerDate: Date | Notifications.NotificationTriggerInput
) {
  // Only schedule local notifications
  const trigger: Notifications.NotificationTriggerInput =
    triggerDate instanceof Date
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate }
      : triggerDate;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: `Don't forget: ${taskTitle}`,
    },
    trigger,
  });
}
