import { create } from "zustand"
import { getDatabase } from "../database"

export interface Note {
  id: string
  title: string
  content?: string
  linked_task_id?: string
  linked_habit_id?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

interface NoteStore {
  notes: Note[]
  loadNotes: () => Promise<void>
  addNote: (note: Omit<Note, "id" | "created_at" | "updated_at">) => Promise<void>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],

  loadNotes: async () => {
    const db = getDatabase()
    const result = await db.getAllAsync("SELECT * FROM notes ORDER BY created_at DESC")
    const notes = result.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
    }))
    set({ notes })
  },

  addNote: async (noteData) => {
    const db = getDatabase()
    const id = Date.now().toString()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO notes (id, title, content, linked_task_id, linked_habit_id, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        noteData.title,
        noteData.content || null,
        noteData.linked_task_id || null,
        noteData.linked_habit_id || null,
        JSON.stringify(noteData.tags || []),
        now,
        now,
      ],
    )

    get().loadNotes()
  },

  updateNote: async (id, updates) => {
    const db = getDatabase()
    const now = new Date().toISOString()

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ")

    const values = Object.values(updates).map((value) => {
      if (Array.isArray(value)) return JSON.stringify(value)
      return value
    })

    await db.runAsync(`UPDATE notes SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id])

    get().loadNotes()
  },

  deleteNote: async (id) => {
    const db = getDatabase()
    await db.runAsync("DELETE FROM notes WHERE id = ?", [id])
    get().loadNotes()
  },
}))
