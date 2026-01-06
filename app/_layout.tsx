// app/_layout.tsx
import { AppThemeProvider, useThemeMode } from "@/theme/AppThemeProvider";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function AppStack() {
  const { colorScheme } = useThemeMode();
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf") });
  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <AppStack />
    </AppThemeProvider>
  );
}
