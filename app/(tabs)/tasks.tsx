import TaskCard from "@/components/TaskCard";
import TaskEditorModal, { TaskEditorPayload } from "@/components/TaskEditorModal";
import QuickAddInput from "@/components/QuickAddInput";
import { ensureNotificationSetup } from "@/lib/notifications";
import { useTasks } from "@/store/useTasks";
import { useThemeColors } from "@/theme/AppThemeProvider";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";

export default function TasksScreen() {
  const { tasks, addTask } = useTasks();
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    (async () => {
      const ok = await ensureNotificationSetup();
      if (!ok) Alert.alert("Notifications disabled", "Enable them in OS settings to get reminders.");
    })();
  }, []);

  const handleCreate = async (v: TaskEditorPayload) => {
    await addTask(v);              // our store accepts the normalized payload
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>Tasks</Text>

      {/* Quick-add input with natural language and voice */}
      <QuickAddInput onTaskCreated={() => {
        // Optional: add haptic feedback here
      }} />

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Button title="Add Task" onPress={() => setOpen(true)} />
        <Button title="Settings" onPress={() => router.push("/settings")} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => <TaskCard task={item} />}
      />

      <TaskEditorModal open={open} onClose={() => setOpen(false)} onSubmit={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
});
