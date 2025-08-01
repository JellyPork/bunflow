import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActionSheetModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateSubtask?: () => void;
  type: "task" | "habit" | "note";
}

export function ActionSheetModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  onCreateSubtask,
  type,
}: ActionSheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.action} onPress={onEdit}>
            <Text style={styles.actionText}>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
          {type === "task" && onCreateSubtask && (
            <TouchableOpacity style={styles.action} onPress={onCreateSubtask}>
              <Text style={styles.actionText}>Create Subtask</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.action, styles.delete]} onPress={onDelete}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 220,
    alignItems: 'stretch',
    elevation: 4,
  },
  action: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#444',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  delete: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});
