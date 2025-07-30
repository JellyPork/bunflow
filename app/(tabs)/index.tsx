"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { AddModal } from "../../components/AddModal"
import { FilterModal } from "../../components/FilterModal"
import { TaskItem } from "../../components/TaskItem"
import { useTaskStore } from "../../lib/stores/taskStore"

export default function TasksScreen() {
  const { colors, dark } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed">("all")

  const { tasks, loadTasks } = useTaskStore()

  useEffect(() => {
    loadTasks()
  }, [])

  const filteredTasks = tasks.filter((task) => {
    const today = new Date();
    const taskDate = task.due_date ? new Date(task.due_date) : null;
    switch (filter) {
      case "today":
        return taskDate && taskDate.toDateString() === today.toDateString();
      case "upcoming":
        return taskDate && taskDate > today && !task.completed;
      case "completed":
        return task.completed;
      default:
        return true;
    }
  });

  // Split into incomplete and completed
  const incompleteTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  const styles = createStyles(colors, dark)

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <Ionicons name="filter" size={20} color={dark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterTabs}>
          {["all", "today", "upcoming", "completed"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.activeFilterTab]}
              onPress={() => setFilter(tab as any)}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.activeFilterTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filter === "completed" ? (
          <FlatList
            data={completedTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskItem task={item} style={{ opacity: 0.5 }} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkbox-outline" size={64} color={dark ? "#48484A" : "#C7C7CC"} />
                <Text style={styles.emptyText}>No completed tasks</Text>
                <Text style={styles.emptySubtext}>Complete a task to see it here</Text>
              </View>
            }
          />
        ) : (
          <>
            <FlatList
              data={incompleteTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TaskItem task={item} />}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkbox-outline" size={64} color={dark ? "#48484A" : "#C7C7CC"} />
                  <Text style={styles.emptyText}>No tasks found</Text>
                  <Text style={styles.emptySubtext}>Tap the + button to create your first task</Text>
                </View>
              }
            />
            {completedTasks.length > 0 && (
              <View style={styles.completedDividerContainer}>
                <View style={styles.completedDivider} />
                <Text style={styles.completedDividerText}>Completed Tasks</Text>
                <View style={styles.completedDivider} />
              </View>
            )}
            {completedTasks.length > 0 && (
              <FlatList
                data={completedTasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TaskItem task={item} style={{ opacity: 0.5 }} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
      <AddModal visible={showAddModal} onClose={() => setShowAddModal(false)} defaultType="task" />
      <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} onApplyFilter={() => {}} />
    </>
  );
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
    filterButton: {
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
    filterTabs: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
      backgroundColor: dark ? "#1C1C1E" : "#FFFFFF",
    },
    activeFilterTab: {
      backgroundColor: "#007AFF",
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: "500",
      color: dark ? "#FFFFFF" : "#000000",
    },
    activeFilterTabText: {
      color: "#FFFFFF",
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
    completedDividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      paddingHorizontal: 20,
    },
    completedDivider: {
      flex: 1,
      height: 1,
      backgroundColor: dark ? '#444' : '#CCC',
      marginHorizontal: 8,
    },
    completedDividerText: {
      fontSize: 14,
      color: dark ? '#8E8E93' : '#6D6D70',
      fontWeight: '600',
    },
  });
