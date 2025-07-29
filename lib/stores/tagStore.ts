import { create } from "zustand"
import { getDatabase } from "../database"

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

interface TagStore {
  tags: Tag[]
  loadTags: () => Promise<void>
  addTag: (name: string, color: string) => Promise<void>
  updateTag: (id: string, name: string, color: string) => Promise<void>
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  loadTags: async () => {
    const db = getDatabase()
    const result = await db.getAllAsync("SELECT * FROM tags ORDER BY name ASC")
    set({ tags: result as Tag[] })
  },

  addTag: async (name: string, color: string) => {
    const db = getDatabase();
    const id = Date.now().toString();
    await db.runAsync(
      `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
      [id, name, color]
    );
},

updateTag: async (id: string, name: string, color: string) => {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE tags SET name = ?, color = ? WHERE id = ?`,
    [name, color, id]
  );
},
}))
