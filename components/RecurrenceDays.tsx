import React from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/theme/AppThemeProvider";

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  value: number[];                 // JS 0..6 (Sun..Sat)
  onChange: (days: number[]) => void;
  size?: number;
};

export default function RecurrenceDays({ value, onChange, size = 36 }: Props) {
  const colors = useThemeColors();

  const toggle = (idx: number) => {
    const on = value.includes(idx);
    onChange(on ? value.filter((d) => d !== idx) : [...value, idx]);
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {WEEKDAY_LABELS.map((lab, idx) => {
        const active = value.includes(idx);
        return (
          <Pressable
            key={idx}
            onPress={() => toggle(idx)}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "#d1ffd6" : "transparent",
              borderColor: active ? "#0a8f2a" : colors.border,
            }}
          >
            <Text style={{ fontWeight: "600", color: colors.text }}>{lab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
