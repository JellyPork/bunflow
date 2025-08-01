import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native"
import { Calendar } from "react-native-calendars"
import type { Habit } from "../lib/stores/habitStore"
import type { Task } from "../lib/stores/taskStore"

interface StreakCalendarProps {
  habits: Habit[]
  tasks?: Task[]
}

export function StreakCalendar({ habits, tasks }: StreakCalendarProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  // Generate marked dates for habits and tasks
  const markedDates: Record<string, any> = {};

  habits.forEach((habit) => {
    if (habit.last_completed_date) {
      markedDates[habit.last_completed_date] = {
        marked: true,
        dotColor: "#34C759",
      };
    }
  });

  // Add tasks to markedDates
  if (tasks) {
    tasks.forEach((task) => {
      if (task.due_date) {
        const dateStr = new Date(task.due_date).toISOString().slice(0, 10);
        markedDates[dateStr] = markedDates[dateStr] || {};
        markedDates[dateStr].marked = true;
        markedDates[dateStr].dotColor = markedDates[dateStr].dotColor || "#007AFF";
      }
    });
  }

  const styles = createStyles(isDark)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          theme={{
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            calendarBackground: isDark ? "#1C1C1E" : "#FFFFFF",
            textSectionTitleColor: isDark ? "#FFFFFF" : "#000000",
            selectedDayBackgroundColor: "#007AFF",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#007AFF",
            dayTextColor: isDark ? "#FFFFFF" : "#000000",
            textDisabledColor: isDark ? "#48484A" : "#C7C7CC",
            dotColor: "#34C759",
            selectedDotColor: "#FFFFFF",
            arrowColor: "#007AFF",
            monthTextColor: isDark ? "#FFFFFF" : "#000000",
            indicatorColor: "#007AFF",
            textDayFontWeight: "500",
            textMonthFontWeight: "600",
            textDayHeaderFontWeight: "500",
          }}
        />
      </View>

      <View style={styles.habitsList}>
        <Text style={styles.habitsTitle}>Habit Streaks</Text>
        {habits.map((habit) => (
          <View key={habit.id} style={styles.habitItem}>
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitFrequency}>{habit.frequency_pattern}</Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{habit.streak_count}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
        ))}
        {tasks && tasks.length > 0 && (
          <>
            <Text style={[styles.habitsTitle, { marginTop: 24 }]}>Tasks</Text>
            {tasks.map((task) => (
              <View key={task.id} style={styles.habitItem}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{task.title}</Text>
                  {task.due_date && (
                    <Text style={styles.habitFrequency}>{new Date(task.due_date).toLocaleDateString()}</Text>
                  )}
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakLabel}>{task.completed ? "Completed" : "Pending"}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#F2F2F7",
    },
    calendarContainer: {
      margin: 20,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    },
    habitsList: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    habitsTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 16,
    },
    habitItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
    },
    habitInfo: {
      flex: 1,
    },
    habitName: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#000000",
      marginBottom: 4,
    },
    habitFrequency: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    streakInfo: {
      alignItems: "center",
    },
    streakNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#34C759",
    },
    streakLabel: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
  })

  