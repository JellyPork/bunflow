import { useTasks } from "@/store/useTasks";
import { useThemeColors } from "@/theme/AppThemeProvider";
import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import TagChip from "./TagChip";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function TagSelector({ selectedIds, onChange }: Props) {
  const { tags, addOrGetTagByName } = useTasks();
  const [newTag, setNewTag] = useState("");
  const colors = useThemeColors();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Sort tags by usage count (most used first)
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }, [tags]);

  const toggle = (id: string) => {
    const s = new Set(selectedIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    onChange(Array.from(s));
  };

  const addTag = () => {
    const name = newTag.trim();
    if (!name) return;
    const id = addOrGetTagByName(name);            // creates or reuses, assigns color
    setNewTag("");
    // select it
    onChange(Array.from(new Set([...selectedIds, id])));
  };

  return (
    <View style={{ gap: 8 }}>
      {/* Existing tags list */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {sortedTags.map((t) => (
          <Pressable key={t.id} onPress={() => toggle(t.id)}>
            <View
              style={{
                transform: [{ scale: selectedSet.has(t.id) ? 1.02 : 1 }],
                opacity: selectedSet.has(t.id) ? 1 : 0.85,
              }}
            >
              <TagChip name={t.name} color={t.color} />
            </View>
          </Pressable>
        ))}
        {sortedTags.length === 0 && (
          <Text style={{ opacity: 0.6, color: colors.text }}>No tags yet — add one below.</Text>
        )}
      </View>

      {/* Create new tag */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          placeholder="New tag…"
          placeholderTextColor={colors.textSecondary}
          value={newTag}
          onChangeText={setNewTag}
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }}
        />
        <Pressable
          onPress={addTag}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.inputBackground,
          }}
        >
          <Text style={{ color: colors.text }}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
