"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { AddModal } from "../../components/AddModal"
import { HabitItem } from "../../components/HabitItem"
import { StreakCalendar } from "../../components/StreakCalendar"
import { useHabitStore } from "../../lib/stores/habitStore"

export default function HabitsScreen() {
  const { colors, dark } = useTheme() // 'dark' is true for dark theme
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const { habits, loadHabits } = useHabitStore()

  useEffect(() => {
    loadHabits()
  }, [])

  const styles = createStyles(colors, dark)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "calendar" : "list"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "list" ? (
        <FlatList
          data={habits}
          horizontal={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HabitItem habit={item} showStreak />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="repeat" size={64} color={dark ? "#48484A" : "#C7C7CC"} />
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubtext}>Create habits to build consistency</Text>
            </View>
          }
        />
      ) : (
        <StreakCalendar habits={habits} />
      )}

      <AddModal visible={showAddModal} onClose={() => setShowAddModal(false)} defaultType="habit" />
    </View>
  )
}

const createStyles = (colors: any, dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
    },
    headerActions: {
      flexDirection: "row",
      gap: 12,
    },
    viewButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: dark ? "#1C1C1E" : "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#007AFF",
      justifyContent: "center",
      alignItems: "center",
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: dark ? "#8E8E93" : "#6D6D70",
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: dark ? "#8E8E93" : "#6D6D70",
      marginTop: 8,
      textAlign: "center",
    },
  })
