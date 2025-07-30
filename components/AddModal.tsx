"use client"

import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { RECURRENCE_OPTIONS, REMINDER_PRESETS, WEEKDAYS } from "../constants/TaskOptions"
import { useHabitStore } from "../lib/stores/habitStore"
import { useNoteStore } from "../lib/stores/noteStore"
import { useTagStore } from "../lib/stores/tagStore"
import { useTaskStore } from "../lib/stores/taskStore"
  const [reminders, setReminders] = useState<any[]>([]);

interface AddModalProps {
  visible: boolean
  onClose: () => void
  defaultType?: "task" | "habit" | "note"
}

export function AddModal({ visible, onClose, defaultType = "task" }: AddModalProps) {
  const { colors, dark: isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<"task" | "habit" | "note">(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [frequency, setFrequency] = useState("daily");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagColor, setTagColor] = useState<string>("#007AFF");
  const [editingTag, setEditingTag] = useState<{ id: string, name: string, color: string } | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("#007AFF");
  const { tags, loadTags, addTag, updateTag } = useTagStore();
  const [recurrence, setRecurrence] = useState<any>(RECURRENCE_OPTIONS[0].value);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [reminders, setReminders] = useState<any[]>([]); // Always initialize as array

  const { addTask } = useTaskStore();
  const { addHabit } = useHabitStore();
  const { addNote } = useNoteStore();

  // Load tags when modal opens
  // Move hook to top level, do not call conditionally
  useState(() => {
    if (visible) loadTags();
  });

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title")
      return
    }

    try {
      switch (selectedType) {
        case "task": {
          let recurrencePattern = recurrence;
          if (recurrence && typeof recurrence === 'object' && 'frequency' in recurrence && recurrence.frequency === "weekly") {
            recurrencePattern = { ...recurrence, weekdays: selectedWeekdays };
          }
          await addTask({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            completed: false,
            tags: selectedTags,
            due_date: deadline ? deadline.toISOString() : undefined,
            recurrence_pattern: recurrencePattern ? JSON.stringify(recurrencePattern) : undefined,
            reminders: Array.isArray(reminders) && reminders.length > 0 ? reminders : [],
          })
          break;
        }
        case "habit":
          await addHabit({
            name: title.trim(),
            frequency_pattern: frequency,
            streak_count: 0,
            completed_today: false,
          })
          break
        case "note":
          await addNote({
            title: title.trim(),
            content: description.trim() || undefined,
          })
          break
      }

      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setFrequency("daily")
      setSelectedTags([])
      setDeadline(null)
      setReminders([])
      onClose()
    } catch (error) {
      console.error("Failed to save:", error)
      Alert.alert("Error", "Failed to save. Please try again.")
    }
  }

  const styles = createStyles(isDark)



  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add New</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selector */}
          <View style={styles.typeSelector}>
            {(["task", "habit", "note"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, selectedType === type && styles.activeTypeButton]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons
                  name={type === "task" ? "checkbox" : type === "habit" ? "repeat" : "document-text"}
                  size={20}
                  color={selectedType === type ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000"}
                />
                <Text style={[styles.typeButtonText, selectedType === type && styles.activeTypeButtonText]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {selectedType === "task" ? "Task Title" : selectedType === "habit" ? "Habit Name" : "Note Title"}
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={`Enter ${selectedType} title...`}
              placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{selectedType === "note" ? "Content" : "Description"}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={`Enter ${selectedType === "note" ? "content" : "description"}...`}
              placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Task-specific options */}
          {selectedType === "task" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {(["low", "medium", "high"] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.activePriorityButton,
                        { backgroundColor: p === "low" ? "#34C759" : p === "medium" ? "#FF9500" : "#FF3B30" },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={styles.priorityButtonText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tag Selector */}
                <View style={styles.inputGroup}>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsSelector}>
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagButton,
                            isSelected && {
                              backgroundColor: tag.color || "#007AFF",
                              borderColor: tag.color || "#007AFF",
                            },
                          ]}
                          onPress={() => {
                            setSelectedTags((prev) =>
                              prev.includes(tag.name)
                                ? prev.filter((t) => t !== tag.name)
                                : [...prev, tag.name]
                            );
                          }}
                          onLongPress={() => {
                            setEditingTag(tag);
                            setEditTagName(tag.name);
                            setEditTagColor(tag.color || "#007AFF");
                          }}
                        >
                          <Text
                            style={[
                              styles.tagButtonText,
                              isSelected && { color: "#fff" },
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
                {/* Add new tag input */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    value={newTagName}
                    onChangeText={setNewTagName}
                    placeholder="Add new tag..."
                    placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
                  />
                  {/* Color Picker */}
                  <View style={{ flexDirection: 'row', marginRight: 8 }}>
                    {tagColors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: color,
                          marginHorizontal: 2,
                          borderWidth: tagColor === color ? 2 : 0,
                          borderColor: "#222",
                        }}
                        onPress={() => setTagColor(color)}
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.tagButton, { backgroundColor: "#007AFF", borderColor: "#007AFF" }]}
                    onPress={async () => {
                      const name = newTagName.trim();
                      if (!name) return;
                      if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                        Alert.alert("Tag exists", "This tag already exists.");
                        return;
                      }
                      try {
                        await addTag(name, tagColor); // Pass color to addTag
                        loadTags();
                        setSelectedTags(prev => [...prev, name]);
                        setNewTagName("");
                      } catch (e) {
                        Alert.alert("Error", "Failed to add tag.");
                      }
                    }}
                  >
                    <Text style={[styles.tagButtonText, { color: "#fff" }]}>Add</Text>
                  </TouchableOpacity>
                </View>
                </View>

              {/* Deadline Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deadline</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateButtonText}>{deadline ? deadline.toLocaleDateString() : 'Select Date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
                    <Text style={styles.dateButtonText}>{deadline ? deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={deadline || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false)
                      if (date) setDeadline((prev) => {
                        if (prev) {
                          // keep time, update date
                          const newDate = new Date(date)
                          newDate.setHours(prev.getHours(), prev.getMinutes())
                          return newDate
                        }
                        return date
                      })
                    }}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={deadline || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, time) => {
                      setShowTimePicker(false)
                      if (time) setDeadline((prev) => {
                        const newDate = prev ? new Date(prev) : new Date()
                        newDate.setHours(time.getHours(), time.getMinutes())
                        return newDate
                      })
                    }}
                  />
                )}
              </View>

              {/* Recurrence Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recurrence</Text>
                <Picker
                  selectedValue={recurrence}
                  onValueChange={(val) => {
                    setRecurrence(val);
                    if (!val || typeof val !== 'object' || val.frequency !== "weekly") setSelectedWeekdays([]);
                  }}
                  style={{ backgroundColor: isDark ? '#222' : '#fff', color: isDark ? '#fff' : '#222' }}
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <Picker.Item key={opt.label} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
                {/* Weekday selector for weekly/biweekly */}
                {recurrence && typeof recurrence === 'object' && recurrence.frequency === "weekly" && (
                  <View style={{ flexDirection: 'row', marginTop: 12, gap: 4, flexWrap: 'wrap' }}>
                    {WEEKDAYS.map(day => (
                      <TouchableOpacity
                        key={day.value}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: selectedWeekdays.includes(day.value) ? '#007AFF' : (isDark ? '#222' : '#eee'),
                          borderWidth: 1,
                          borderColor: selectedWeekdays.includes(day.value) ? '#007AFF' : (isDark ? '#444' : '#ccc'),
                          marginRight: 4,
                          marginBottom: 4,
                        }}
                        onPress={() => {
                          setSelectedWeekdays((prev) =>
                            prev.includes(day.value)
                              ? prev.filter((v) => v !== day.value)
                              : [...prev, day.value]
                          );
                        }}
                      >
                        <Text style={{ color: selectedWeekdays.includes(day.value) ? '#fff' : (isDark ? '#fff' : '#222'), fontWeight: '500' }}>{day.label.charAt(0)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Reminders Selector (only show if deadline is selected) */}
              {deadline && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reminders</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {REMINDER_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.label}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: reminders.some(r => JSON.stringify(r) === JSON.stringify(preset.value)) ? '#007AFF' : (isDark ? '#222' : '#eee'),
                          borderWidth: 1,
                          borderColor: reminders.some(r => JSON.stringify(r) === JSON.stringify(preset.value)) ? '#007AFF' : (isDark ? '#444' : '#ccc'),
                          marginRight: 4,
                          marginBottom: 4,
                        }}
                        onPress={() => {
                          if (preset.value === null) {
                            setReminders([]);
                          } else {
                            setReminders((prev) => {
                              const exists = prev.some(r => JSON.stringify(r) === JSON.stringify(preset.value));
                              if (exists) {
                                return prev.filter(r => JSON.stringify(r) !== JSON.stringify(preset.value));
                              } else {
                                // Remove "None" if present
                                return [...prev.filter(r => r !== null), preset.value];
                              }
                            });
                          }
                        }}
                      >
                        <Text style={{ color: reminders.some(r => JSON.stringify(r) === JSON.stringify(preset.value)) ? '#fff' : (isDark ? '#fff' : '#222'), fontWeight: '500' }}>{preset.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {Array.isArray(reminders) && reminders.length > 0 && (
                    <Text style={{ marginTop: 8, color: isDark ? '#fff' : '#222', fontSize: 13 }}>
                      Selected: {reminders.map(r => {
                        const preset = REMINDER_PRESETS.find(p => JSON.stringify(p.value) === JSON.stringify(r));
                        return preset ? preset.label : '';
                      }).filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}

          {/* Habit-specific options */}
          {selectedType === "habit" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencySelector}>
                {[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "custom", label: "Custom" },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    style={[styles.frequencyButton, frequency === f.value && styles.activeFrequencyButton]}
                    onPress={() => setFrequency(f.value)}
                  >
                    <Text
                      style={[styles.frequencyButtonText, frequency === f.value && styles.activeFrequencyButtonText]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Edit Tag Section */}
          {editingTag && (
            <View style={{ marginVertical: 12, padding: 12, backgroundColor: isDark ? "#222" : "#eee", borderRadius: 8 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 8, color: isDark ? "#fff" : "#000" }}>Edit Tag</Text>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                value={editTagName}
                onChangeText={setEditTagName}
                placeholder="Tag name"
                placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
              />
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {tagColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: color,
                      marginHorizontal: 2,
                      borderWidth: editTagColor === color ? 2 : 0,
                      borderColor: "#222",
                    }}
                    onPress={() => setEditTagColor(color)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.tagButton, { backgroundColor: "#007AFF", borderColor: "#007AFF" }]}
                  onPress={async () => {
                    if (!editTagName.trim()) return;
                    await updateTag(editingTag.id, editTagName.trim(), editTagColor);
                    loadTags();
                    setEditingTag(null);
                  }}
                >
                  <Text style={[styles.tagButtonText, { color: "#fff" }]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tagButton, { backgroundColor: "#eee", borderColor: "#ccc" }]}
                  onPress={() => setEditingTag(null)}
                >
                  <Text style={[styles.tagButtonText, { color: "#222" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  tagsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: isDark ? '#222' : '#eee',
    borderWidth: 1,
    borderColor: isDark ? '#444' : '#ccc',
    marginBottom: 6,
  },
  activeTagButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagButtonText: {
    color: isDark ? '#fff' : '#222',
    fontWeight: '500',
  },
  activeTagButtonText: {
    color: '#fff',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: isDark ? '#222' : '#eee',
    borderWidth: 1,
    borderColor: isDark ? '#444' : '#ccc',
  },
  dateButtonText: {
    color: isDark ? '#fff' : '#222',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: isDark ? "#000000" : "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? "#38383A" : "#E5E5EA",
  },
  cancelButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  typeSelector: {
    flexDirection: "row",
    marginVertical: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    gap: 8,
  },
  activeTypeButton: {
    backgroundColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  activeTypeButtonText: {
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: isDark ? "#FFFFFF" : "#000000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: isDark ? "#FFFFFF" : "#000000",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "#38383A" : "#E5E5EA",
  },
  textArea: {
    minHeight: 100,
  },
  prioritySelector: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activePriorityButton: {
    opacity: 1,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  frequencySelector: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "#38383A" : "#E5E5EA",
  },
  activeFrequencyButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: isDark ? "#FFFFFF" : "#000000",
  },
  activeFrequencyButtonText: {
    color: "#FFFFFF",
  },
});

// Add this state near your other useState calls
const [tagColor, setTagColor] = useState("#007AFF");

// Add this array for color options (customize as needed)
const tagColors = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA"];
