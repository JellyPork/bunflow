import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { Colors } from "@/constants/Colors";

export type ThemeMode = "light" | "dark" | "system";

type Ctx = {
  mode: ThemeMode;                             // user's selection
  setMode: (m: ThemeMode) => void;
  colorScheme: Exclude<ColorSchemeName, null>; // 'light' | 'dark' (effective)
};

const ThemeModeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "app.theme.mode";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<Exclude<ColorSchemeName, null>>(
    (Appearance.getColorScheme() ?? "light") as "light" | "dark"
  );

  // load user preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setMode(v);
    });
  }, []);

  // watch system change when on "system"
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme ?? "light") as "light" | "dark");
    });
    return () => sub.remove();
  }, []);

  // persist selection
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, [mode]);

  const colorScheme = mode === "system" ? systemScheme : mode;
  const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const ctx = useMemo<Ctx>(() => ({ mode, setMode, colorScheme }), [mode, colorScheme]);

  return (
    <ThemeModeContext.Provider value={ctx}>
      <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const v = useContext(ThemeModeContext);
  if (!v) throw new Error("useThemeMode must be used within AppThemeProvider");
  return v;
}

export function useThemeColors() {
  const { colorScheme } = useThemeMode();
  return Colors[colorScheme];
}
