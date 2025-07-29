import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"
import { useThemeStore } from "../app/_layout"
import type { Note } from "../lib/stores/noteStore"

interface NoteItemProps {
  note: Note
}

export function NoteItem({ note }: NoteItemProps) {
  const colorScheme = useColorScheme()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark')

  const styles = createStyles(isDark)

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.date}>{format(new Date(note.created_at), "MMM d")}</Text>
      </View>

      {note.content && (
        <Text style={styles.content} numberOfLines={3}>
          {note.content}
        </Text>
      )}

      <View style={styles.footer}>
        {(note.linked_task_id || note.linked_habit_id) && (
          <View style={styles.linkIndicator}>
            <Ionicons name="link" size={12} color={isDark ? "#8E8E93" : "#6D6D70"} />
            <Text style={styles.linkText}>Linked to {note.linked_task_id ? "task" : "habit"}</Text>
          </View>
        )}

        {note.tags && note.tags.length > 0 && (
          <View style={styles.tags}>
            {note.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {note.tags.length > 2 && <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#000000",
      flex: 1,
      marginRight: 8,
    },
    date: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#6D6D70",
    },
    content: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#6D6D70",
      lineHeight: 20,
      marginBottom: 12,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    linkIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
    },
    linkText: {
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
