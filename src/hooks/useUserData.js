import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userDataService } from '../services/userDataService'
import { useLocalStorage } from './useLocalStorage'

export const useUserData = () => {
  const { user, loading: authLoading } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle', 'syncing', 'success', 'error'
  const [lastSync, setLastSync] = useState(null)
  const [syncError, setSyncError] = useState(null)

  // Local storage fallback
  const [localFolders, setLocalFolders] = useLocalStorage('listalico-folders', [
    {
      id: 1,
      name: 'Personal',
      color: '#666666',
      notes: []
    }
  ])
  const [localNotes, setLocalNotes] = useLocalStorage('listalico-notes', [])
  const [localDeletedFolders, setLocalDeletedFolders] = useLocalStorage('listalico-deleted-folders', [])
  const [localDeletedNotes, setLocalDeletedNotes] = useLocalStorage('listalico-deleted-notes', [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Set user ID when user changes
  useEffect(() => {
    if (user) {
      userDataService.setUserId(user.id)
    }
  }, [user])

  // Load user data when authenticated
  useEffect(() => {
    if (user && !authLoading && isOnline) {
      loadUserData()
    }
  }, [user, authLoading, isOnline])

  const loadUserData = async () => {
    if (!user || !isOnline) return

    try {
      setSyncStatus('syncing')
      setSyncError(null)

      const [serverFolders, serverNotes] = await Promise.all([
        userDataService.getFolders(),
        userDataService.getNotes()
      ])

      // Convert server data to local format
      const convertedFolders = userDataService.convertServerFolders(serverFolders)
      const convertedNotes = userDataService.convertServerNotes(serverNotes)

      // Update local state
      setLocalFolders(convertedFolders)
      setLocalNotes(convertedNotes)
      setLastSync(new Date())
      setSyncStatus('success')
    } catch (error) {
      console.error('Error loading user data:', error)
      setSyncError(error.message)
      setSyncStatus('error')
    }
  }

  const syncData = async () => {
    if (!user || !isOnline) return

    try {
      setSyncStatus('syncing')
      setSyncError(null)

      const syncResults = await userDataService.syncUserData(localFolders, localNotes)
      
      if (syncResults.errors.length > 0) {
        console.warn('Sync completed with errors:', syncResults.errors)
      }

      // Reload data after sync
      await loadUserData()
      
      setSyncStatus('success')
    } catch (error) {
      console.error('Error syncing data:', error)
      setSyncError(error.message)
      setSyncStatus('error')
    }
  }

  const createFolder = async (folder) => {
    if (isOnline && user) {
      try {
        const serverFolder = await userDataService.createFolder(folder)
        const convertedFolder = userDataService.convertServerFolders([serverFolder])[0]
        setLocalFolders(prev => [...prev, convertedFolder])
      } catch (error) {
        console.error('Error creating folder:', error)
        // Fallback to local storage
        setLocalFolders(prev => [...prev, folder])
      }
    } else {
      // Offline mode - use local storage
      setLocalFolders(prev => [...prev, folder])
    }
  }

  const updateFolder = async (folderId, updates) => {
    if (isOnline && user) {
      try {
        await userDataService.updateFolder(folderId, updates)
        setLocalFolders(prev => 
          prev.map(folder => 
            folder.id === folderId 
              ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
              : folder
          )
        )
      } catch (error) {
        console.error('Error updating folder:', error)
        // Fallback to local storage
        setLocalFolders(prev => 
          prev.map(folder => 
            folder.id === folderId 
              ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
              : folder
          )
        )
      }
    } else {
      // Offline mode - use local storage
      setLocalFolders(prev => 
        prev.map(folder => 
          folder.id === folderId 
            ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
            : folder
        )
      )
    }
  }

  const deleteFolder = async (folderId) => {
    if (isOnline && user) {
      try {
        await userDataService.deleteFolder(folderId)
        setLocalFolders(prev => prev.filter(folder => folder.id !== folderId))
        // Also delete notes in this folder
        setLocalNotes(prev => prev.filter(note => note.folderId !== folderId))
      } catch (error) {
        console.error('Error deleting folder:', error)
        // Fallback to local storage
        setLocalFolders(prev => prev.filter(folder => folder.id !== folderId))
        setLocalNotes(prev => prev.filter(note => note.folderId !== folderId))
      }
    } else {
      // Offline mode - use local storage
      setLocalFolders(prev => prev.filter(folder => folder.id !== folderId))
      setLocalNotes(prev => prev.filter(note => note.folderId !== folderId))
    }
  }

  const createNote = async (note) => {
    if (isOnline && user) {
      try {
        const serverNote = await userDataService.createNote(note)
        const convertedNote = userDataService.convertServerNotes([serverNote])[0]
        setLocalNotes(prev => [convertedNote, ...prev])
      } catch (error) {
        console.error('Error creating note:', error)
        // Fallback to local storage
        setLocalNotes(prev => [note, ...prev])
      }
    } else {
      // Offline mode - use local storage
      setLocalNotes(prev => [note, ...prev])
    }
  }

  const updateNote = async (noteId, updates) => {
    if (isOnline && user) {
      try {
        await userDataService.updateNote(noteId, updates)
        setLocalNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { ...note, ...updates, updatedAt: new Date().toISOString() }
              : note
          )
        )
      } catch (error) {
        console.error('Error updating note:', error)
        // Fallback to local storage
        setLocalNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { ...note, ...updates, updatedAt: new Date().toISOString() }
              : note
          )
        )
      }
    } else {
      // Offline mode - use local storage
      setLocalNotes(prev => 
        prev.map(note => 
          note.id === noteId 
            ? { ...note, ...updates, updatedAt: new Date().toISOString() }
            : note
        )
      )
    }
  }

  const deleteNote = async (noteId) => {
    if (isOnline && user) {
      try {
        await userDataService.deleteNote(noteId)
        setLocalNotes(prev => prev.filter(note => note.id !== noteId))
      } catch (error) {
        console.error('Error deleting note:', error)
        // Fallback to local storage
        setLocalNotes(prev => prev.filter(note => note.id !== noteId))
      }
    } else {
      // Offline mode - use local storage
      setLocalNotes(prev => prev.filter(note => note.id !== noteId))
    }
  }

  return {
    // Data
    folders: localFolders,
    notes: localNotes,
    deletedFolders: localDeletedFolders,
    deletedNotes: localDeletedNotes,
    
    // Setters
    setFolders: setLocalFolders,
    setNotes: setLocalNotes,
    setDeletedFolders: setLocalDeletedFolders,
    setDeletedNotes: setLocalDeletedNotes,
    
    // CRUD operations
    createFolder,
    updateFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    
    // Sync
    syncData,
    syncStatus,
    lastSync,
    syncError,
    isOnline,
    
    // Auth state
    isAuthenticated: !!user,
    isLoading: authLoading
  }
}
