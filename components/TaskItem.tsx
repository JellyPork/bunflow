import { Ionicons } from "@expo/vector-icons"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { useEffect } from "react"
import { Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"
import { useThemeStore } from "../app/_layout"
import { useTagStore } from "../lib/stores/tagStore"
import { type Task, useTaskStore } from "../lib/stores/taskStore"

interface TaskItemProps {
  task: Task
  style?: any
}

interface TagProps {
  tag: { name: string; color?: string }
  styles: ReturnType<typeof createStyles>
}

interface TagsViewProps {
  tags: { name: string; color?: string }[]
  styles: ReturnType<typeof createStyles>
}

const Tag: React.FC<TagProps> = ({ tag, styles }) => (
  <View style={[styles.tag, { backgroundColor: tag.color || "#007AFF" }]}>
    <Text style={styles.tagText}>{tag.name}</Text>
  </View>
)

const TagsView: React.FC<TagsViewProps> = ({ tags, styles }) => (
  <View style={styles.tags}>
    {tags.slice(0, 2).map((tag, index) => (
      <Tag key={index} tag={tag} styles={styles} />
    ))}
    {tags.length > 2 && <Text style={styles.moreTagsText}>+{tags.length - 2}</Text>}
  </View>
)

export function TaskItem({ task }: TaskItemProps) {
  // Helper to format recurrence info
  const formatRecurrence = (rec: any) => {
    if (!rec) return null;
    if (rec.frequency === 'daily') return 'Repeats: Every Day';
    if (rec.frequency === 'weekly') {
      let days = '';
      if (rec.weekdays && Array.isArray(rec.weekdays)) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days = rec.weekdays.map((d: number) => dayNames[d]).join(', ');
      }
      return `Repeats: Every Week${days ? ' (' + days + ')' : ''}`;
    }
    if (rec.frequency === 'monthly') return 'Repeats: Every Month';
    if (rec.frequency === 'yearly') return 'Repeats: Every Year';
    return null;
  };
  const colorScheme = useColorScheme()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark')
  const { toggleTask } = useTaskStore()
  const { tags: allTags, loadTags } = useTagStore() // get all tags
  
  useEffect(() => {
    loadTags()
  }, [loadTags])

  // Map tag names to tag objects with color
  const taskTags = (task.tags || []).map(name => {
    const tagObj = allTags.find(t => t.name === name)
    return { name, color: tagObj?.color }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF3B30"
      case "medium":
        return "#FF9500"
      case "low":
        return "#34C759"
      default:
        return "#8E8E93"
    }
  }

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null

    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isPast(date)) return `Overdue • ${format(date, "MMM d")}`
    return format(date, "MMM d")
  }

  const styles = createStyles(isDark)

  return (
    <>
      <Pressable
        style={[styles.container, arguments[0]?.style]}
        onPress={() => toggleTask(task.id)}
        android_ripple={{ color: '#ddd' }}
      >
        <TouchableOpacity style={styles.checkbox} onPress={() => toggleTask(task.id)}>
          <Ionicons
            name={task.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={task.completed ? "#34C759" : isDark ? "#8E8E93" : "#C7C7CC"}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <Text style={[styles.title, task.completed && styles.completedTitle]}>{task.title}</Text>
              {task.recurrence_pattern && (
                <Text style={{ fontSize: 12, color: isDark ? '#8E8E93' : '#6D6D70', marginTop: 2 }}>
                  {formatRecurrence(task.recurrence_pattern)}
                </Text>
              )}
            </View>
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
            {taskTags.length > 0 && (
              <TagsView tags={taskTags} styles={styles} />
            )}
          </View>
          {/* Show deadline if available */}
          {task.due_date && (
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={14} color={isDark ? "#8E8E93" : "#6D6D70"} />
              <Text style={styles.dueDate}>{formatDueDate(task.due_date)}</Text>
            </View>
          )}
          {/* Optionally show description */}
          {task.description ? (
            <Text style={styles.description}>{task.description}</Text>
          ) : null}
        </View>
      </Pressable>
    </>
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
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#000000",
      flex: 1,
      marginRight: 8,
    },
    completedTitle: {
      textDecorationLine: "line-through",
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    priorityIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    description: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginBottom: 8,
      lineHeight: 20,
    },
    completedText: {
      textDecorationLine: "line-through",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dueDateContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    overdueBadge: {
      backgroundColor: "#FF3B30",
    },
    dueDate: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#6D6D70",
      marginLeft: 4,
    },
    overdueText: {
      color: "#FFFFFF",
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
