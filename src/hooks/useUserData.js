import { useLocalStorage } from './useLocalStorage'

export const useUserData = () => {
  const [folders, setFolders] = useLocalStorage('listalico-folders', [
    {
      id: 1,
      name: 'Personal',
      color: '#666666',
      notes: []
    }
  ])
  const [notes, setNotes] = useLocalStorage('listalico-notes', [])
  const [deletedFolders, setDeletedFolders] = useLocalStorage('listalico-deleted-folders', [])
  const [deletedNotes, setDeletedNotes] = useLocalStorage('listalico-deleted-notes', [])

  const createFolder = async (folder) => {
    setFolders(prev => [...prev, folder])
  }

  const updateFolder = async (folderId, updates) => {
    setFolders(prev => 
      prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
          : folder
      )
    )
  }

  const deleteFolder = async (folderId) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId))
    setNotes(prev => prev.filter(note => note.folderId !== folderId))
  }

  const createNote = async (note) => {
    setNotes(prev => [note, ...prev])
  }

  const updateNote = async (noteId, updates) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    )
  }

  const deleteNote = async (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
  }

  return {
    folders,
    notes,
    deletedFolders,
    deletedNotes,
    setFolders,
    setNotes,
    setDeletedFolders,
    setDeletedNotes,
    createFolder,
    updateFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote
  }
}
