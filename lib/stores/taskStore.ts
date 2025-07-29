import { create } from "zustand"
import { getDatabase } from "../database"

export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  priority: "low" | "medium" | "high"
  recurrence_pattern?: string
  reminders?: string[]
  completed: boolean
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
    )

    get().loadTasks()
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
      await get().updateTask(id, { completed: !task.completed })
    }
  },
}))
