"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApplyFilter: (filters: any) => void
}

export function FilterModal({ visible, onClose, onApplyFilter }: FilterModalProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const [selectedPriority, setSelectedPriority] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])

  const styles = createStyles(isDark)

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={() => onApplyFilter({})}>
            <Text style={styles.applyButton}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            {["high", "medium", "low"].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={styles.filterOption}
                onPress={() => {
                  if (selectedPriority.includes(priority)) {
                    setSelectedPriority(selectedPriority.filter((p) => p !== priority))
                  } else {
                    setSelectedPriority([...selectedPriority, priority])
                  }
                }}
              >
                <Ionicons
                  name={selectedPriority.includes(priority) ? "checkbox" : "square-outline"}
                  size={20}
                  color="#007AFF"
                />
                <Text style={styles.filterOptionText}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            {["completed", "pending", "overdue"].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.filterOption}
                onPress={() => {
                  if (selectedStatus.includes(status)) {
                    setSelectedStatus(selectedStatus.filter((s) => s !== status))
                  } else {
                    setSelectedStatus([...selectedStatus, status])
                  }
                }}
              >
                <Ionicons
                  name={selectedStatus.includes(status) ? "checkbox" : "square-outline"}
                  size={20}
                  color="#007AFF"
                />
                <Text style={styles.filterOptionText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#F2F2F7",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#E5E5EA",
    },
    cancelButton: {
      fontSize: 16,
      color: "#007AFF",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    applyButton: {
      fontSize: 16,
      fontWeight: "600",
      color: "#007AFF",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 16,
    },
    filterOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    filterOptionText: {
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#000000",
    },
  })
