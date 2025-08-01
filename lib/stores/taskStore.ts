import { create } from "zustand";
import { scheduleReminderNotification } from "../../app/_layout";
import { getDatabase } from "../database";

export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  priority: "low" | "medium" | "high"
  recurrence_pattern?: string
  reminders?: string[]
  completed: boolean
  completed_at?: string
  tags?: string[]
  parent_task_id?: string
  created_at: string
  updated_at: string
}

interface TaskStore {
  tasks: Task[]
  loadTasks: () => Promise<void>
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    const db = getDatabase()
    const result = await db.getAllAsync("SELECT * FROM tasks ORDER BY created_at DESC")
    const tasks = result.map((row: any) => ({
      ...row,
      completed: Boolean(row.completed),
      reminders: row.reminders ? JSON.parse(row.reminders) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      recurrence_pattern: row.recurrence_pattern ? JSON.parse(row.recurrence_pattern) : undefined,
    }))
    set({ tasks })
  },

  addTask: async (taskData) => {
    const db = getDatabase()
    const id = Date.now().toString()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO tasks (id, title, description, due_date, priority, recurrence_pattern, reminders, completed, tags, parent_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        taskData.title,
        taskData.description || null,
        taskData.due_date || null,
        taskData.priority,
        taskData.recurrence_pattern || null,
        JSON.stringify(taskData.reminders || []),
        taskData.completed ? 1 : 0,
        JSON.stringify(taskData.tags || []),
        taskData.parent_task_id || null,
        now,
        now,
      ],
    );

    // Schedule local notifications for reminders
    if (taskData.due_date && Array.isArray(taskData.reminders)) {
      const dueDate = new Date(taskData.due_date);
      for (const reminderRaw of taskData.reminders) {
        if (!reminderRaw) continue;
        let reminder: any = reminderRaw;
        if (typeof reminderRaw === 'string') {
          try {
            reminder = JSON.parse(reminderRaw);
          } catch {}
        }
        if (!reminder || typeof reminder !== 'object') continue;
        // Calculate trigger time
        let triggerDate = dueDate;
        if (reminder.type === "before_due" && reminder.value && reminder.unit) {
          const unitMs = reminder.unit === "minutes" ? 60000 : reminder.unit === "hours" ? 3600000 : reminder.unit === "days" ? 86400000 : 0;
          triggerDate = new Date(dueDate.getTime() - reminder.value * unitMs);
        } else if (reminder.type === "before_start" && reminder.value === 0) {
          triggerDate = dueDate;
        }
        if (triggerDate > new Date()) {
          console.log(`Scheduling reminder for task "${taskData.title}" at ${triggerDate}`);
          await scheduleReminderNotification(taskData.title, triggerDate);
        }
      }
    }

    get().loadTasks();
  },

  updateTask: async (id, updates) => {
    const db = getDatabase()
    const now = new Date().toISOString()

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ")

    const values = Object.values(updates).map((value) => {
      if (Array.isArray(value)) return JSON.stringify(value)
      if (typeof value === "boolean") return value ? 1 : 0
      return value
    })

    await db.runAsync(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id])

    get().loadTasks()
  },

  deleteTask: async (id) => {
    const db = getDatabase()
    await db.runAsync("DELETE FROM tasks WHERE id = ?", [id])
    get().loadTasks()
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (task) {
      // also add completed_at field toggle
      try {
        await get().updateTask(id, { completed: !task.completed, completed_at: task.completed ? undefined : new Date().toISOString() });
      } catch (error) {
        console.error("Failed to toggle task:", error);
      }
    }
  },
}))
