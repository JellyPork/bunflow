import { useThemeColors, useThemeMode, type ThemeMode } from "@/theme/AppThemeProvider";
import TagManager from "@/components/TagManager";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const OPTIONS: ThemeMode[] = ["light", "system", "dark"];

export default function SettingsScreen() {
  const { mode, setMode } = useThemeMode();
  const colors = useThemeColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>Appearance</Text>
      <Text style={{ opacity: 0.7, marginBottom: 12, color: colors.text }}>Choose how Bunflow looks.</Text>

      <View style={{ gap: 10 }}>
        {OPTIONS.map((opt) => {
          const active = mode === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setMode(opt)}
              style={[
                styles.row,
                { borderColor: active ? colors.borderActive : colors.border },
                active && { backgroundColor: colors.activeBackground },
              ]}
            >
              <Text style={[styles.rowText, { color: colors.text }]}>{opt[0].toUpperCase() + opt.slice(1)}</Text>
              <Text style={{ opacity: active ? 1 : 0.2, color: colors.text }}>{active ? "●" : "○"}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={{ opacity: 0.7, color: colors.text }}>
          "System" follows your device setting and switches automatically.
        </Text>
      </View>

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: colors.separator, marginVertical: 24 }} />

      {/* Tag Manager */}
      <TagManager />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowText: { fontSize: 16, fontWeight: "600" },
});
