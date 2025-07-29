import { create } from "zustand"
import { getDatabase } from "../database"

export interface Habit {
  id: string
  name: string
  frequency_pattern: string
  streak_count: number
  last_completed_date?: string
  reminders?: string[]
  tags?: string[]
  completed_today: boolean
  created_at: string
  updated_at: string
}

interface HabitStore {
  habits: Habit[]
  loadHabits: () => Promise<void>
  addHabit: (habit: Omit<Habit, "id" | "created_at" | "updated_at">) => Promise<void>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  completeHabit: (id: string) => Promise<void>
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],

  loadHabits: async () => {
    const db = getDatabase()
    const result = await db.getAllAsync("SELECT * FROM habits ORDER BY created_at DESC")
    let habits = result.map((row: any) => ({
      ...row,
      completed_today: Boolean(row.completed_today),
      reminders: row.reminders ? JSON.parse(row.reminders) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
    }))

    // Check and reset habits based on their frequency
    const today = new Date()
    habits = await Promise.all(habits.map(async (habit) => {
      const lastCompletedDate = habit.last_completed_date ? new Date(habit.last_completed_date) : null
      
      // Reset condition based on frequency pattern
      let shouldReset = false
      if (habit.frequency_pattern === 'daily') {
        // Reset if last completion was not today
        shouldReset = !lastCompletedDate || 
          lastCompletedDate.getDate() !== today.getDate() ||
          lastCompletedDate.getMonth() !== today.getMonth() ||
          lastCompletedDate.getFullYear() !== today.getFullYear()
      } else if (habit.frequency_pattern === 'weekly') {
        // Reset if last completion was in a different week
        const lastWeek = lastCompletedDate ? Math.floor(lastCompletedDate.getTime() / (7 * 24 * 60 * 60 * 1000)) : 0
        const thisWeek = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000))
        shouldReset = !lastCompletedDate || lastWeek < thisWeek
      }

      if (shouldReset) {
        // Reset completed_today but maintain streak if within allowed time
        const streakLost = habit.frequency_pattern === 'daily' 
          ? (lastCompletedDate && (today.getTime() - lastCompletedDate.getTime()) > 48 * 60 * 60 * 1000)  // 48 hours for daily
          : (lastCompletedDate && (today.getTime() - lastCompletedDate.getTime()) > 9 * 24 * 60 * 60 * 1000)  // 9 days for weekly

        if (streakLost) {
          await db.runAsync(
            "UPDATE habits SET completed_today = 0, streak_count = 0 WHERE id = ?",
            [habit.id]
          )
          return { ...habit, completed_today: false, streak_count: 0 }
        } else {
          await db.runAsync(
            "UPDATE habits SET completed_today = 0 WHERE id = ?",
            [habit.id]
          )
          return { ...habit, completed_today: false }
        }
      }
      
      return habit
    }))

    set({ habits })
  },

  addHabit: async (habitData) => {
    const db = getDatabase()
    const id = Date.now().toString()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO habits (id, name, frequency_pattern, streak_count, last_completed_date, reminders, tags, completed_today, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        habitData.name,
        habitData.frequency_pattern,
        habitData.streak_count,
        habitData.last_completed_date || null,
        JSON.stringify(habitData.reminders || []),
        JSON.stringify(habitData.tags || []),
        habitData.completed_today ? 1 : 0,
        now,
        now,
      ],
    )

    get().loadHabits()
  },

  updateHabit: async (id, updates) => {
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

    await db.runAsync(`UPDATE habits SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id])

    get().loadHabits()
  },

  deleteHabit: async (id) => {
    const db = getDatabase()
    await db.runAsync("DELETE FROM habits WHERE id = ?", [id])
    get().loadHabits()
  },

  completeHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id)
    if (habit && !habit.completed_today) {  // Only proceed if habit isn't already completed
      const today = new Date()
      const lastCompletedDate = habit.last_completed_date ? new Date(habit.last_completed_date) : null
      
      // Increment streak
      const newStreak = habit.streak_count + 1

      await get().updateHabit(id, {
        completed_today: true,  // Always set to true, no toggling
        last_completed_date: today.toISOString(),
        streak_count: newStreak,
      })
    }
  },
}))
