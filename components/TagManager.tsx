import { useTasks } from "@/store/useTasks";
import { useThemeColors } from "@/theme/AppThemeProvider";
import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const TAG_PALETTE = [
  "#7aa2ff", // blue
  "#8b5cf6", // violet
  "#34d399", // green
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
];

export default function TagManager() {
  const { tags, renameTag, deleteTag, changeTagColor } = useTasks();
  const colors = useThemeColors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  // Sort tags by usage count
  const sortedTags = [...tags].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  const handleRename = () => {
    if (editingId && editName.trim()) {
      renameTag(editingId, editName.trim());
      setEditingId(null);
      setEditName("");
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Tag",
      `Delete "${name}"? This will remove it from all tasks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTag(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.text }]}>Manage Tags</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Edit names, change colors, or delete tags
      </Text>

      <ScrollView style={styles.tagList}>
        {sortedTags.length === 0 && (
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 20 }}>
            No tags yet. Create tags when adding tasks.
          </Text>
        )}

        {sortedTags.map((tag) => (
          <View
            key={tag.id}
            style={[
              styles.tagRow,
              { borderColor: colors.border, backgroundColor: colors.inputBackground },
            ]}
          >
            {/* Tag Color Circle */}
            <Pressable onPress={() => setColorPickerId(tag.id)}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: tag.color || "#7aa2ff", borderColor: colors.border },
                ]}
              />
            </Pressable>

            {/* Tag Name (editable) */}
            <View style={{ flex: 1 }}>
              {editingId === tag.id ? (
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  onBlur={handleRename}
                  onSubmitEditing={handleRename}
                  autoFocus
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.borderActive, backgroundColor: colors.background },
                  ]}
                />
              ) : (
                <Pressable
                  onPress={() => {
                    setEditingId(tag.id);
                    setEditName(tag.name);
                  }}
                >
                  <Text style={[styles.tagName, { color: colors.text }]}>{tag.name}</Text>
                </Pressable>
              )}
              <Text style={[styles.usageText, { color: colors.textSecondary }]}>
                Used {tag.usageCount || 0} time{tag.usageCount === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Delete Button */}
            <Pressable onPress={() => handleDelete(tag.id, tag.name)} style={styles.deleteButton}>
              <Text style={{ color: colors.danger, fontWeight: "600" }}>Delete</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={colorPickerId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setColorPickerId(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setColorPickerId(null)}
        >
          <View style={[styles.colorPickerModal, { backgroundColor: colors.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {TAG_PALETTE.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => {
                    if (colorPickerId) {
                      changeTagColor(colorPickerId, color);
                      setColorPickerId(null);
                    }
                  }}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color, borderColor: colors.border },
                  ]}
                />
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  tagList: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  tagName: {
    fontSize: 16,
    fontWeight: "600",
  },
  usageText: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  colorPickerModal: {
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
});
