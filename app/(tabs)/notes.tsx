"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { AddModal } from "../../components/AddModal"
import { NoteItem } from "../../components/NoteItem"
import { useNoteStore } from "../../lib/stores/noteStore"

export default function NotesScreen() {
  const { colors, dark } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)

  const { notes, loadNotes } = useNoteStore()

  useEffect(() => {
    loadNotes()
  }, [])

  const styles = createStyles(colors, dark)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NoteItem note={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={dark ? "#48484A" : "#C7C7CC"} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Capture your thoughts and ideas</Text>
          </View>
        }
      />

      <AddModal visible={showAddModal} onClose={() => setShowAddModal(false)} defaultType="note" />
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
