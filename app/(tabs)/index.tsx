"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { ActionSheetModal } from "../../components/ActionSheetModal"
import { AddModal } from "../../components/AddModal"
import { FilterModal } from "../../components/FilterModal"
import { TaskItem } from "../../components/TaskItem"
import { useTaskStore } from "../../lib/stores/taskStore"
// Habit imports
import { useHabitStore } from "@/lib/stores/habitStore"

export default function TasksScreen() {
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { colors, dark } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed" | "overdue">("all")
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const { tasks, loadTasks } = useTaskStore()

  // Habit constants
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const { habits, loadHabits } = useHabitStore()


  useEffect(() => {
    loadTasks();
    loadHabits();
  }, [])

  const today = new Date();
  const isSameDay = (date1: Date | null, date2: Date | null) =>
    date1 && date2 && date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  // Determine filter type from statusFilter, fallback to filter state if none selected
  let activeFilter: "all" | "today" | "upcoming" | "completed" | "overdue" = filter;
  if (statusFilter.includes("completed")) activeFilter = "completed";
  else if (statusFilter.includes("overdue")) activeFilter = "overdue";
  else if (statusFilter.includes("today")) activeFilter = "today";
  else if (statusFilter.includes("upcoming")) activeFilter = "upcoming";
  else if (statusFilter.includes("pending")) activeFilter = "all";

  let filteredTasks: typeof tasks = [];
  let completedTasks: typeof tasks = [];
  let incompleteTasks: typeof tasks = [];

  if (activeFilter === "completed") {
    completedTasks = tasks.filter((task) => {
      if (!task.completed) return false;
      if (task.completed_at) {
        const completedDate = new Date(task.completed_at);
        return isSameDay(completedDate, today);
      }else {
        return true;
      }
    });
    filteredTasks = [];
    incompleteTasks = [];
  } else {
    filteredTasks = tasks.filter((task) => {
      const taskDate = task.due_date ? new Date(task.due_date) : null;
      switch (activeFilter) {
        case "today":
          return taskDate && isSameDay(taskDate, today) && !task.completed || (task.completed && task.completed_at && isSameDay(new Date(task.completed_at), today));
        case "upcoming":
          return (taskDate && taskDate > today && !task.completed) || (!taskDate && !task.completed);
        case "overdue":
          return taskDate && taskDate < today && !task.completed;
        case "all":
          return !task.completed || (task.completed && task.completed_at && isSameDay(new Date(task.completed_at), today));
        default:
          return !task.completed;
      }
    });
    incompleteTasks = filteredTasks.filter((task) => !task.completed);
    completedTasks = filteredTasks.filter((task) => task.completed);
  }

  // Apply priority filter if set
  if (priorityFilter.length > 0) {
    incompleteTasks = incompleteTasks.filter((task) => priorityFilter.includes(task.priority));
    completedTasks = completedTasks.filter((task) => priorityFilter.includes(task.priority));
  }

  const styles = createStyles(colors, dark)

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
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
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <Ionicons name="filter" size={20} color={dark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* {viewMode === "list" ? (
                <FlatList
                  data={habits}
                  horizontal={true}
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
              )} */}

        {/* FilterTabs removed; filter now handled by FilterModal */}
        
        

        

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
              data={[...incompleteTasks, ...completedTasks]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskItem
                  task={item}
                  style={item.completed ? { opacity: 0.5 } : undefined}
                  onLongPress={() => {
                    setSelectedTask(item);
                    setActionModalVisible(true);
                  }}
                />
              )}
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
      <ActionSheetModal
        visible={actionModalVisible}
        type="task"
        onClose={() => setActionModalVisible(false)}
        onEdit={() => {
          setActionModalVisible(false);
          // TODO: Implement edit task modal

          alert('Edit Task: ' + (selectedTask?.title || ''));
        }}
        onDelete={() => {
          setActionModalVisible(false);
          // TODO: Implement delete task logic
          alert('Delete Task: ' + (selectedTask?.title || ''));
        }}
        onCreateSubtask={() => {
          setActionModalVisible(false);
          // TODO: Implement create subtask logic
          alert('Create Subtask for: ' + (selectedTask?.title || ''));
        }}
      />
          </>
        )}
      </View>
      <AddModal visible={showAddModal} onClose={() => setShowAddModal(false)} defaultType="task" />
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilter={({ priority, status }) => {
          setPriorityFilter(priority || []);
          setStatusFilter(status || []);
          setShowFilterModal(false);
        }}
        selectedPriority={priorityFilter}
        selectedStatus={statusFilter}
      />
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
      marginTop: 8, // Add space above filter tabs
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
      marginBottom: 24, // Add more space below habits list
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

    // Habit styles
    viewButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: dark ? "#1C1C1E" : "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },
  });
