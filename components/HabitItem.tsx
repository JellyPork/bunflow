import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"
import { type Habit, useHabitStore } from "../lib/stores/habitStore"

interface HabitItemProps {
  habit: Habit
  showStreak?: boolean
}

export function HabitItem({ habit, showStreak = false }: HabitItemProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { completeHabit } = useHabitStore()

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "#FF6B35"
    if (streak >= 14) return "#FF9500"
    if (streak >= 7) return "#34C759"
    return "#007AFF"
  }

  const styles = createStyles(isDark)

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={() => completeHabit(habit.id)}>
      <TouchableOpacity style={styles.checkbox} onPress={() => completeHabit(habit.id)}>
        <Ionicons
          name={habit.completed_today ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={habit.completed_today ? "#34C759" : isDark ? "#8E8E93" : "#C7C7CC"}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, habit.completed_today && styles.completedTitle]}>{habit.name}</Text>
          {showStreak && (
            <View style={[styles.streakBadge, { backgroundColor: getStreakColor(habit.streak_count) }]}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <Text style={styles.streakText}>{habit.streak_count}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.frequencyContainer}>
            <Ionicons name="repeat" size={12} color={isDark ? "#8E8E93" : "#6D6D70"} />
            <Text style={styles.frequency}>
              {habit.frequency_pattern.charAt(0).toUpperCase() + habit.frequency_pattern.slice(1)}
            </Text>
          </View>

          {habit.tags && habit.tags.length > 0 && (
            <View style={styles.tags}>
              {habit.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {habit.tags.length > 2 && <Text style={styles.moreTagsText}>+{habit.tags.length - 2}</Text>}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
    },
    checkbox: {
      marginRight: 12,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#000000",
      flex: 1,
      marginRight: 8,
    },
    completedTitle: {
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 2,
    },
    streakText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    frequencyContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
    },
    frequency: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginLeft: 4,
    },
    tags: {
      flexDirection: "row",
      alignItems: "center",
    },
    tag: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 4,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "500",
      color: "#FFFFFF",
    },
    moreTagsText: {
      fontSize: 10,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginLeft: 4,
    },
  })
