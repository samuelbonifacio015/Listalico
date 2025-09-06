import { supabase } from '../lib/supabase'

class UserDataService {
  constructor() {
    this.userId = null
  }

  setUserId(userId) {
    this.userId = userId
  }

  // Folders operations
  async getFolders() {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createFolder(folder) {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: this.userId,
        name: folder.name,
        color: folder.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateFolder(folderId, updates) {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFolder(folderId) {
    if (!this.userId) throw new Error('User not authenticated')

    // First delete all notes in this folder
    await this.deleteNotesByFolder(folderId)

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  // Notes operations
  async getNotes() {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createNote(note) {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: this.userId,
        title: note.title,
        content: note.content,
        folder_id: note.folderId,
        priority: note.priority || 'medium',
        categories: note.categories || [],
        is_task: note.isTask || false,
        completed: note.completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateNote(noteId, updates) {
    if (!this.userId) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteNote(noteId) {
    if (!this.userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  async deleteNotesByFolder(folderId) {
    if (!this.userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('folder_id', folderId)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  // Sync local data with server
  async syncUserData(localFolders, localNotes) {
    if (!this.userId) throw new Error('User not authenticated')

    try {
      // Get server data
      const [serverFolders, serverNotes] = await Promise.all([
        this.getFolders(),
        this.getNotes()
      ])

      // Create maps for easier lookup
      const serverFoldersMap = new Map(serverFolders.map(f => [f.id, f]))
      const serverNotesMap = new Map(serverNotes.map(n => [n.id, n]))

      // Sync folders
      const foldersToCreate = []
      const foldersToUpdate = []

      for (const localFolder of localFolders) {
        if (serverFoldersMap.has(localFolder.id)) {
          // Check if update is needed
          const serverFolder = serverFoldersMap.get(localFolder.id)
          if (this.isFolderDifferent(localFolder, serverFolder)) {
            foldersToUpdate.push(localFolder)
          }
        } else {
          // New folder to create
          foldersToCreate.push(localFolder)
        }
      }

      // Sync notes
      const notesToCreate = []
      const notesToUpdate = []

      for (const localNote of localNotes) {
        if (serverNotesMap.has(localNote.id)) {
          // Check if update is needed
          const serverNote = serverNotesMap.get(localNote.id)
          if (this.isNoteDifferent(localNote, serverNote)) {
            notesToUpdate.push(localNote)
          }
        } else {
          // New note to create
          notesToCreate.push(localNote)
        }
      }

      // Execute sync operations
      const syncResults = {
        foldersCreated: 0,
        foldersUpdated: 0,
        notesCreated: 0,
        notesUpdated: 0,
        errors: []
      }

      // Create folders
      for (const folder of foldersToCreate) {
        try {
          await this.createFolder(folder)
          syncResults.foldersCreated++
        } catch (error) {
          syncResults.errors.push(`Error creating folder ${folder.name}: ${error.message}`)
        }
      }

      // Update folders
      for (const folder of foldersToUpdate) {
        try {
          await this.updateFolder(folder.id, folder)
          syncResults.foldersUpdated++
        } catch (error) {
          syncResults.errors.push(`Error updating folder ${folder.name}: ${error.message}`)
        }
      }

      // Create notes
      for (const note of notesToCreate) {
        try {
          await this.createNote(note)
          syncResults.notesCreated++
        } catch (error) {
          syncResults.errors.push(`Error creating note ${note.title}: ${error.message}`)
        }
      }

      // Update notes
      for (const note of notesToUpdate) {
        try {
          await this.updateNote(note.id, note)
          syncResults.notesUpdated++
        } catch (error) {
          syncResults.errors.push(`Error updating note ${note.title}: ${error.message}`)
        }
      }

      return syncResults
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`)
    }
  }

  // Helper methods
  isFolderDifferent(localFolder, serverFolder) {
    return (
      localFolder.name !== serverFolder.name ||
      localFolder.color !== serverFolder.color ||
      new Date(localFolder.updatedAt).getTime() > new Date(serverFolder.updated_at).getTime()
    )
  }

  isNoteDifferent(localNote, serverNote) {
    return (
      localNote.title !== serverNote.title ||
      localNote.content !== serverNote.content ||
      localNote.folderId !== serverNote.folder_id ||
      localNote.priority !== serverNote.priority ||
      JSON.stringify(localNote.categories) !== JSON.stringify(serverNote.categories) ||
      localNote.isTask !== serverNote.is_task ||
      localNote.completed !== serverNote.completed ||
      new Date(localNote.updatedAt).getTime() > new Date(serverNote.updated_at).getTime()
    )
  }

  // Convert server data to local format
  convertServerFolders(serverFolders) {
    return serverFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      notes: [],
      createdAt: folder.created_at,
      updatedAt: folder.updated_at
    }))
  }

  convertServerNotes(serverNotes) {
    return serverNotes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      folderId: note.folder_id,
      priority: note.priority,
      categories: note.categories || [],
      isTask: note.is_task,
      completed: note.completed,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }))
  }
}

export const userDataService = new UserDataService()
