import React from "react";
import { Text, View } from "react-native";
import { useThemeColors } from "@/theme/AppThemeProvider";

export default function TagChip({ name, color = "#7aa2ff" }: { name: string; color?: string }) {
  const colors = useThemeColors();

  // If hex like #RRGGBB, use ~15% alpha for background
  const bg =
    typeof color === "string" && color.startsWith("#") && color.length === 7
      ? `${color}26`
      : "rgba(0,0,0,0.06)";

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <Text style={{ fontWeight: "300", color: colors.text }}>{name}</Text>
    </View>
  );
}
