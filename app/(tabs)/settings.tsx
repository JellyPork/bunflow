"use client"

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useThemeStore } from '../_layout';

export default function SettingsScreen() {
  const colorScheme = useColorScheme()
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [themePref, setThemePref] = React.useState<'system' | 'light' | 'dark'>('system');
  const { theme, setTheme } = useThemeStore();
  const isDark = themePref === 'dark' || (themePref === 'system' && colorScheme === 'dark');
  const styles = createStyles(isDark);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: string
    title: string
    subtitle?: string
    onPress?: () => void
    rightElement?: React.ReactNode
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#C7C7CC"} />}
    </TouchableOpacity>
  )

  // ...existing code...
  // Load preferences on mount
  React.useEffect(() => {
    (async () => {
      const notifPref = await AsyncStorage.getItem('notificationsEnabled');
      if (notifPref !== null) setNotificationsEnabled(notifPref === 'true');
      const themePrefStored = await AsyncStorage.getItem('themePreference');
      if (themePrefStored === 'light' || themePrefStored === 'dark' || themePrefStored === 'system') {
        setThemePref(themePrefStored);
        setTheme(themePrefStored);
      }
    })();
  }, []);

  // Test notification handler
  const handleTestNotification = async () => {
    const { SchedulableTriggerInputTypes, scheduleNotificationAsync } = await import('expo-notifications');
    console.log("Scheduling test notification...");
    await scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test local notification.',
        data: { type: 'test' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        repeats: false,
      },
    });
    console.log("Test notification scheduled.");
  };

  // Persist notification preference
  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');
  };

  // Persist theme preference
  const handleThemeChange = async (value: 'system' | 'light' | 'dark') => {
    setThemePref(value);
    setTheme(value);
    await AsyncStorage.setItem('themePreference', value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Task and habit reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={notificationsEnabled ? "#FFFFFF" : "#f4f3f4"}
              />
            }
          />

          <SettingItem
            icon="moon"
            title="Theme"
            subtitle="Appearance preference"
            rightElement={
              <Picker
                selectedValue={themePref}
                onValueChange={handleThemeChange}
                mode="dropdown"
                style={{ minWidth: 175, color: isDark ? '#fff' : '#222', fontSize: 14, paddingHorizontal: 4, borderRadius: 4 }}
              >
                <Picker.Item label="Light" value="light"/>
                <Picker.Item label="System" value="system"/>
                <Picker.Item label="Dark" value="dark"/>
              </Picker>
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <SettingItem icon="download" title="Export Data" subtitle="Backup your tasks and habits" onPress={() => {}} />

          <SettingItem icon="cloud-upload" title="Import Data" subtitle="Restore from backup" onPress={() => {}} />

          <SettingItem icon="trash" title="Clear All Data" subtitle="Reset the app" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingItem icon="information-circle" title="App Version" subtitle="1.0.0" onPress={() => {}} />

          <SettingItem icon="help-circle" title="Help & Support" subtitle="Get help using the app" onPress={() => {}} />

          <SettingItem icon="star" title="Rate App" subtitle="Leave a review" onPress={() => {}} />

          <SettingItem icon="notifications-outline" title="Test Notification" subtitle="Send a test notification" onPress={handleTestNotification} />
        </View>
      </ScrollView>
    </View>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#F2F2F7",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginHorizontal: 20,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#E5E5EA",
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: "#007AFF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    settingSubtitle: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginTop: 2,
    },
    // Removed themeOptions styles for dropdown
  })
