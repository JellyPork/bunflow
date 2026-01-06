import { useTasks } from "@/store/useTasks";
import { useThemeColors } from "@/theme/AppThemeProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Button,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import RecurrenceDays from "./RecurrenceDays";
import TagSelector from "./TagSelector";

export type Recurrence = "none" | "once" | "daily" | "weekly" | "custom";

export type TaskEditorPayload = {
  title: string;
  notes?: string;
  priority: number;         // numeric
  tagIds: string[];
  recurrence: Recurrence;
  weekdays?: number[];      // 0..6 if weekly
  hour?: number;            // 0..23 (undefined if none)
  minute?: number;          // 0..59 (undefined if none)
  interval?: number;        // e.g., 2 for "every 2 days" (used with custom recurrence)
  intervalUnit?: 'days' | 'weeks';  // unit for custom interval
  endDate?: number;         // timestamp to stop recurrence
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskEditorPayload) => void | Promise<void>;
  initial?: Partial<TaskEditorPayload & { priorityLabel?: "Low" | "Medium" | "High" }>;
  mode?: "create" | "edit";
};

function toHour12(h24: number): { hour12: number; ampm: "AM" | "PM" } {
  const pm = h24 >= 12;
  const base = h24 % 12;
  return { hour12: base === 0 ? 12 : base, ampm: pm ? "PM" : "AM" };
}
function toHour24(h12: number, ampm: "AM" | "PM") {
  const h = Math.max(1, Math.min(12, Math.floor(h12 || 12)));
  if (ampm === "AM") return h % 12;
  return h === 12 ? 12 : h + 12;
}

export default function TaskEditorModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
}: Props) {
  const { priorities } = useTasks();
  const colors = useThemeColors();

  // ---------- keyboard inset ----------
  const scrollRef = useRef<ScrollView>(null);   

  // ---------- state ----------
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // priority: keep label for UI, convert to numeric on submit
  const defaultLabel: "Low" | "Medium" | "High" = initial?.priority
    ? (priorities.reduce((best, cur) =>
        Math.abs(cur.value - (initial!.priority as number)) < Math.abs(best.value - (initial!.priority as number))
          ? cur : best, priorities[0]).label as any)
    : (initial?.priorityLabel ?? "Medium");
  const [priorityLabel, setPriorityLabel] = useState<"Low" | "Medium" | "High">(defaultLabel);

  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);

  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "none");
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? []);

  const hourInit = typeof initial?.hour === "number" ? initial!.hour : 9;
  const minuteInit = typeof initial?.minute === "number" ? initial!.minute : 0;

  const { hour12: h12, ampm: ap } = toHour12(hourInit);
  const [hour12, setHour12] = useState<number>(h12);
  const [ampm, setAmpm] = useState<"AM" | "PM">(ap);
  const [hourText, setHourText] = useState<string>(String(h12));
  const [minute, setMinute] = useState<number>(minuteInit);
  const [minuteText, setMinuteText] = useState<string>(String(minuteInit).padStart(2, "0"));

  // Custom interval state
  const [interval, setInterval] = useState<number>(initial?.interval ?? 1);
  const [intervalText, setIntervalText] = useState<string>(String(initial?.interval ?? 1));
  const [intervalUnit, setIntervalUnit] = useState<'days' | 'weeks'>(initial?.intervalUnit ?? 'days');

  // End date state
  const [endDate, setEndDate] = useState<Date | undefined>(
    initial?.endDate ? new Date(initial.endDate) : undefined
  );
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // reset when opened
  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setNotes(initial?.notes ?? "");
      setPriorityLabel(defaultLabel);
      setTagIds(initial?.tagIds ?? []);
      setRecurrence(initial?.recurrence ?? "none");
      setWeekdays(initial?.weekdays ?? []);
      const startH = typeof initial?.hour === "number" ? initial!.hour : 9;
      const startM = typeof initial?.minute === "number" ? initial!.minute : 0;
      const s = toHour12(startH);
      setHour12(s.hour12);
      setAmpm(s.ampm);
      setHourText(String(s.hour12));
      setMinute(startM);
      setMinuteText(String(startM).padStart(2, "0"));
      setInterval(initial?.interval ?? 1);
      setIntervalText(String(initial?.interval ?? 1));
      setIntervalUnit(initial?.intervalUnit ?? 'days');
      setEndDate(initial?.endDate ? new Date(initial.endDate) : undefined);
      setShowEndDatePicker(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const priorityValue = useMemo(() => {
    const p = priorities.find((p) => p.label === priorityLabel) ?? priorities[1];
    return p.value;
  }, [priorityLabel, priorities]);

  // ---------- submit ----------
  const save = async () => {
    const payload: TaskEditorPayload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority: priorityValue,
      tagIds,
      recurrence,
      weekdays: recurrence === "weekly" ? weekdays : undefined,
      hour: recurrence !== "none" ? toHour24(hour12, ampm) : undefined,
      minute: recurrence !== "none" ? minute : undefined,
      interval: recurrence === "custom" ? interval : undefined,
      intervalUnit: recurrence === "custom" ? intervalUnit : undefined,
      endDate: endDate ? endDate.getTime() : undefined,
    };
    await onSubmit(payload);
    onClose();
  };

  // ---------- UI ----------
  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      statusBarTranslucent
    >
    
      <KeyboardAwareScrollView
            innerRef={(r) => { scrollRef.current = r; }}                // optional, if you still want to call methods
            contentContainerStyle={[styles.modalBody, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid                      // important for Android
            enableAutomaticScroll                // auto-scroll focused inputs
            extraScrollHeight={80}               // push a bit more above keyboard
            extraHeight={0}                      // keep default; adjust if needed on iOS
            enableResetScrollToCoords={false}    // don't snap back unexpectedly
        >
          <Text style={[styles.h1, { color: colors.text }]}>{mode === "edit" ? "Edit Task" : "New Task"}</Text>

          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            placeholder="e.g., Buy groceries"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            placeholder="optional"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { height: 80, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["Low", "Medium", "High"] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPriorityLabel(p)}
                style={[
                  styles.pill,
                  { borderColor: colors.border },
                  priorityLabel === p && { backgroundColor: colors.activeBackground, borderColor: colors.borderActive }
                ]}
              >
                <Text style={{ color: colors.text }}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
          <TagSelector 
            selectedIds={tagIds} 
            onChange={setTagIds}
          />


          <Text style={[styles.label, { color: colors.text }]}>Reminder</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["none", "once", "daily", "weekly", "custom"] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRecurrence(r)}
                style={[
                  styles.pill,
                  { borderColor: colors.border },
                  recurrence === r && { backgroundColor: colors.activeBackground, borderColor: colors.borderActive }
                ]}
              >
                <Text style={{ textTransform: "capitalize", color: colors.text }}>{r}</Text>
              </Pressable>
            ))}
          </View>

          {recurrence !== "none" && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>Reminder time</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {/* Hour (1..12) - free text while typing */}
                <TextInput
                  keyboardType="number-pad"
                  placeholder="HH"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { width: 64, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={hourText}
                  maxLength={2}
                  onChangeText={(v) => {
                    const clean = v.replace(/[^\d]/g, "");
                    setHourText(clean);
                    const n = parseInt(clean, 10);
                    if (!Number.isNaN(n) && n >= 1 && n <= 12) {
                      setHour12(n);
                    }
                  }}
                  onBlur={() => {
                    const n = parseInt(hourText, 10);
                    const fixed = !Number.isNaN(n) && n >= 1 && n <= 12 ? n : hour12;
                    setHour12(fixed);
                    setHourText(String(fixed));
                  }}
                />

                {/* Minute (00..59) */}
                <TextInput
                  keyboardType="number-pad"
                  placeholder="MM"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { width: 64, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={minuteText}
                  maxLength={2}
                  onChangeText={(v) => {
                    const clean = v.replace(/[^\d]/g, "");
                    setMinuteText(clean);
                    const n = parseInt(clean, 10);
                    if (!Number.isNaN(n) && n >= 0 && n <= 59) {
                      setMinute(n);
                    }
                  }}
                  onBlur={() => {
                    const n = parseInt(minuteText, 10);
                    const fixed = !Number.isNaN(n) && n >= 0 && n <= 59 ? n : minute;
                    setMinute(fixed);
                    setMinuteText(String(fixed).padStart(2, "0"));
                  }}
                />

                {/* AM / PM */}
                <View style={{ flexDirection: "row", gap: 8, marginLeft: 4 }}>
                  {(["AM", "PM"] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setAmpm(m)}
                      style={[
                        styles.pill,
                        { borderColor: colors.border },
                        ampm === m && { backgroundColor: colors.activeBackground, borderColor: colors.borderActive }
                      ]}
                    >
                      <Text style={{ color: colors.text }}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {recurrence === "weekly" && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Days of week</Text>
                  <RecurrenceDays value={weekdays} onChange={setWeekdays} />
                </>
              )}

              {recurrence === "custom" && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Repeat every</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { width: 64, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                      value={intervalText}
                      maxLength={2}
                      onChangeText={(v) => {
                        const clean = v.replace(/[^\d]/g, "");
                        setIntervalText(clean);
                        const n = parseInt(clean, 10);
                        if (!Number.isNaN(n) && n >= 1) {
                          setInterval(n);
                        }
                      }}
                      onBlur={() => {
                        const n = parseInt(intervalText, 10);
                        const fixed = !Number.isNaN(n) && n >= 1 ? n : interval;
                        setInterval(fixed);
                        setIntervalText(String(fixed));
                      }}
                    />

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {(["days", "weeks"] as const).map((unit) => (
                        <Pressable
                          key={unit}
                          onPress={() => setIntervalUnit(unit)}
                          style={[
                            styles.pill,
                            { borderColor: colors.border },
                            intervalUnit === unit && { backgroundColor: colors.activeBackground, borderColor: colors.borderActive }
                          ]}
                        >
                          <Text style={{ color: colors.text }}>{unit}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <Text style={[styles.label, { color: colors.text }]}>End date (optional)</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  style={[styles.input, { flex: 1, justifyContent: 'center', backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                >
                  <Text style={{ color: endDate ? colors.text : colors.textSecondary }}>
                    {endDate ? endDate.toLocaleDateString() : "No end date"}
                  </Text>
                </Pressable>

                {endDate && (
                  <Pressable
                    onPress={() => setEndDate(undefined)}
                    style={[styles.pill, { backgroundColor: colors.danger }]}
                  >
                    <Text style={{ color: '#fff' }}>✕</Text>
                  </Pressable>
                )}
              </View>

              {showEndDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setEndDate(selectedDate);
                  }}
                />
              )}
            </>
          )}

          <View style={styles.footerRow}>
            <Button title="Cancel" onPress={onClose} />
            <Button title={mode === "edit" ? "Save Changes" : "Save Task"} onPress={save} disabled={!title.trim()} />
          </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBody: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 40,
    gap: 12,
    flexGrow: 1,
  },
  h1: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  label: { marginTop: 8, marginBottom: 4, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  pill: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  footerRow: { flexDirection: "row", gap: 10, marginTop: 16, paddingBottom: 8 },
});
