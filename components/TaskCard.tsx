import React, { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTasks, type Task } from "../store/useTasks";
import { useThemeColors } from "@/theme/AppThemeProvider";
import TagChip from "./TagChip";
import TaskEditorModal, { TaskEditorPayload } from "./TaskEditorModal";

function priorityLabelFromValue(
  value: number,
  priorities: { label: string; value: number }[]
) {
  return priorities.reduce(
    (best, cur) =>
      Math.abs(cur.value - value) < Math.abs(best.value - value) ? cur : best,
    priorities[0]
  ).label;
}

function recurrenceText(t: Task) {
  if (t.recurrence === "once") {
    // Format time for one-time reminder
    if (t.hour !== undefined && t.minute !== undefined) {
      const hour12 = t.hour % 12 || 12;
      const ampm = t.hour >= 12 ? "PM" : "AM";
      const min = String(t.minute).padStart(2, "0");
      return `Reminder at ${hour12}:${min} ${ampm}`;
    }
    return "One-time Reminder";
  }
  if (t.recurrence === "daily") return "Every Day";
  if (t.recurrence === "weekly") return "Every Week";
  return "";
}

export default function TaskCard({ task }: { task: Task }) {
  const { toggleTask, removeTask, updateTask, priorities, tags } = useTasks();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const colors = useThemeColors();

  const priorityLabel = useMemo(
    () => priorityLabelFromValue(task.priority, priorities),
    [task.priority, priorities]
  );

  const taskTags = task.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as { id: string; name: string; color?: string }[];

  const MAX_VISIBLE_TAGS = 3;
  const visibleTags = taskTags.slice(0, MAX_VISIBLE_TAGS);
  const remainingCount = taskTags.length - MAX_VISIBLE_TAGS;

  const handleEdit = async (payload: TaskEditorPayload) => {
    await updateTask(task.id, payload);
  };

  return (
    <>
      <Pressable
        onPress={() => toggleTask(task.id)}
        onLongPress={() => setOptionsOpen(true)}
        style={({ pressed }) => [
          {
            borderRadius: 18,
            backgroundColor: colors.cardBackground,
            padding: 14,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        {/* Row: tags left, priority right */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", maxWidth: "75%", alignItems: "center" }}>
            {visibleTags.map((tg) => (
              <TagChip key={tg.id} name={tg.name} color={tg.color} />
            ))}
            {remainingCount > 0 && (
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                backgroundColor: colors.border + "40",
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontWeight: "600", fontSize: 12, color: colors.text }}>+{remainingCount}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontWeight: "700", opacity: 0.6, color: colors.text }}>{priorityLabel}</Text>
        </View>

        {/* Title + circular indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 24,
                fontWeight: "800",
                textDecorationLine: task.done ? "line-through" : "none",
                opacity: task.done ? 0.6 : 1,
                color: colors.text,
              }}
            >
              {task.title}
            </Text>
          </View>

          {/* Visual round indicator (no press handler; whole card toggles) */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#ffffffaa",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 3,
                  borderColor: task.done ? "#4caf50" : "#5b6ab8",
                  backgroundColor: task.done ? "#4caf5030" : "transparent",
                }}
              />
            </View>
          </View>
        </View>

        {/* Notes (big, faint) */}
        {!!task.notes && (
          <Text numberOfLines={1} style={{ marginTop: 10, fontSize: 22, opacity: 0.35, fontWeight: "700", color: colors.text }}>
            {task.notes}
          </Text>
        )}

        {/* Recurrence copy */}
        {!!recurrenceText(task) && (
          <Text style={{ marginTop: 8, fontWeight: "700", opacity: 0.6, color: colors.text }}>
            {recurrenceText(task)}
          </Text>
        )}
      </Pressable>

      {/* Options modal on long press */}
      <Modal
        visible={optionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsOpen(false)}
      >
        <Pressable
          onPress={() => setOptionsOpen(false)}
          style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "center", padding: 24 }}
        >
          <View
            style={{
              backgroundColor: colors.modalBackground,
              borderRadius: 16,
              padding: 16,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4, color: colors.text }}>Task options</Text>

            <Pressable
              onPress={() => {
                setOptionsOpen(false);
                setEditModalOpen(true);
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 16, color: colors.text }}>Edit</Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: colors.separator }} />

            <Pressable
              onPress={() => {
                setOptionsOpen(false);
                removeTask(task.id);
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 16, color: colors.danger, fontWeight: "600" }}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Modal */}
      <TaskEditorModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEdit}
        mode="edit"
        initial={{
          title: task.title,
          notes: task.notes,
          priority: task.priority,
          tagIds: task.tagIds,
          recurrence: task.recurrence,
          weekdays: task.weekdays,
          hour: task.hour,
          minute: task.minute,
        }}
      />
    </>
  );
}
