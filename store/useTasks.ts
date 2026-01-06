// store/useTasks.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from 'expo-crypto';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cancelManyNotifications, scheduleTaskNotifications, type Recurrence } from "../lib/notifications";
// store/useTasks.ts


export type PriorityKey = "Low" | "Medium" | "High";
export type PriorityDef = { key: string; label: string; value: number };

export type Tag = { id: string; name: string; color?: string; usageCount?: number };
export type Task = {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  priority: number;           // numeric to allow custom tiers in-between
  tagIds: string[];           // many-to-many
  recurrence: Recurrence;     // none | once | daily | weekly | custom
  weekdays?: number[];        // 0..6 JS days if weekly
  hour?: number;              // time of day for reminders
  minute?: number;            // time of day for reminders
  interval?: number;          // e.g., 2 for "every 2 days" (used with custom recurrence)
  intervalUnit?: 'days' | 'weeks';  // unit for custom interval
  endDate?: number;           // timestamp to stop recurrence
  notificationIds?: string[]; // scheduled notifications we can cancel
  createdAt: number;
  updatedAt: number;
};

type State = {
  tasks: Task[];
  tags: Tag[];
  priorities: PriorityDef[]; // user-extendable, but default Low/Med/High
};

type Actions = {
  addOrGetTagByName: (name: string) => string; // returns tagId
  addPriorityTier: (label: string, value: number) => void;
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt" | "notificationIds" | "done">) => Promise<void>;
  updateTask: (id: string, t: Omit<Task, "id" | "createdAt" | "updatedAt" | "notificationIds" | "done">) => Promise<void>;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => Promise<void>;
  setTaskTags: (id: string, tagNames: string[]) => void;
  renameTag: (id: string, newName: string) => void;
  deleteTag: (id: string) => void;
  changeTagColor: (id: string, color: string) => void;
  incrementTagUsage: (tagIds: string[]) => void;
};

const DEFAULT_PRIORITIES: PriorityDef[] = [
  { key: "Low",    label: "Low",    value: 1 },
  { key: "Medium", label: "Medium", value: 2 },
  { key: "High",   label: "High",   value: 3 },
];

const TAG_PALETTE = [
  "#7aa2ff", // blue
  "#8b5cf6", // violet
  "#34d399", // green
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
];

export const useTasks = create<State & Actions>()(
  persist(
    (set, get) => ({
      tasks: [],
      tags: [],
      priorities: DEFAULT_PRIORITIES,

      addOrGetTagByName: (rawName) => {
        const name = rawName.trim();
        if (!name) return "";
        const { tags } = get();
        const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing.id;

        const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
        const tag: Tag = { id: Crypto.randomUUID(), name, color, usageCount: 0 };
        set({ tags: [tag, ...tags] });
        return tag.id;
        },

      addPriorityTier: (label, value) => {
        const { priorities } = get();
        // Keep unique by label, allow custom numeric value "between" defaults
        const others = priorities.filter((p) => p.label.toLowerCase() !== label.toLowerCase());
        set({ priorities: [...others, { key: label, label, value }].sort((a,b)=>a.value-b.value) });
      },

      addTask: async (input) => {
        const now = Date.now();
        const id = Crypto.randomUUID();
        const task: Task = {
          ...input,
          id,
          done: false,
          notificationIds: [],
          createdAt: now,
          updatedAt: now,
        };

        // Schedule notifications according to recurrence
        const nids = await scheduleTaskNotifications({
          id,
          title: `📌 ${task.title}`,
          body: "Bunflow reminder",
          recurrence: task.recurrence,
          hour: task.hour,
          minute: task.minute,
          weekdays: task.weekdays,
          interval: task.interval,
          intervalUnit: task.intervalUnit,
          endDate: task.endDate,
        });
        task.notificationIds = nids;

        // Increment usage count for tags
        get().incrementTagUsage(task.tagIds);

        set((s) => ({ tasks: [task, ...s.tasks] }));
      },

      updateTask: async (id, input) => {
        const existingTask = get().tasks.find((t) => t.id === id);
        if (!existingTask) return;

        // Cancel old notifications
        if (existingTask.notificationIds?.length) {
          await cancelManyNotifications(existingTask.notificationIds);
        }

        // Schedule new notifications
        const nids = await scheduleTaskNotifications({
          id,
          title: `📌 ${input.title}`,
          body: "Bunflow reminder",
          recurrence: input.recurrence,
          hour: input.hour,
          minute: input.minute,
          weekdays: input.weekdays,
          interval: input.interval,
          intervalUnit: input.intervalUnit,
          endDate: input.endDate,
        });

        // Increment usage for new tags
        get().incrementTagUsage(input.tagIds);

        // Update task
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, ...input, notificationIds: nids, updatedAt: Date.now() }
              : t
          ),
        }));
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t
          ),
        }));
      },

      removeTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task?.notificationIds?.length) await cancelManyNotifications(task.notificationIds);
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      setTaskTags: (id, tagNames) => {
        const ids = tagNames
          .map((n) => n.trim())
          .filter(Boolean)
          .map((n) => get().addOrGetTagByName(n));

        // de-duplicate
        const dedup = Array.from(new Set(ids));

        // Increment usage for new tags
        get().incrementTagUsage(dedup);

        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, tagIds: dedup, updatedAt: Date.now() } : t)),
        }));
      },

      incrementTagUsage: (tagIds) => {
        set((s) => ({
          tags: s.tags.map((tag) =>
            tagIds.includes(tag.id)
              ? { ...tag, usageCount: (tag.usageCount || 0) + 1 }
              : tag
          ),
        }));
      },

      renameTag: (id, newName) => {
        const name = newName.trim();
        if (!name) return;
        set((s) => ({
          tags: s.tags.map((tag) => (tag.id === id ? { ...tag, name } : tag)),
        }));
      },

      deleteTag: (id) => {
        // Remove tag from all tasks
        set((s) => ({
          tags: s.tags.filter((tag) => tag.id !== id),
          tasks: s.tasks.map((task) => ({
            ...task,
            tagIds: task.tagIds.filter((tagId) => tagId !== id),
            updatedAt: task.tagIds.includes(id) ? Date.now() : task.updatedAt,
          })),
        }));
      },

      changeTagColor: (id, color) => {
        set((s) => ({
          tags: s.tags.map((tag) => (tag.id === id ? { ...tag, color } : tag)),
        }));
      },
    }),
    {
      name: "bunflow.store.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => s, // persist everything (simple for now)
    }
  )
);
