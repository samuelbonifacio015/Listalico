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
      console.log('User authenticated:', user.id)
    }
  }, [user])

  // Load user data when authenticated
  useEffect(() => {
    if (user && !authLoading && isOnline) {
      loadUserData()
    } else if (user && !authLoading && !isOnline) {
      // Si está offline pero autenticado, usar datos locales
      console.log('Offline mode: using local data')
    }
  }, [user, authLoading, isOnline])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user && !authLoading) {
      // Verificar si hay elementos con IDs temporales que necesitan sincronización
      const hasTempFolders = localFolders.some(f => f.id.toString().startsWith('temp_'))
      const hasTempNotes = localNotes.some(n => n.id.toString().startsWith('temp_'))
      
      if (hasTempFolders || hasTempNotes) {
        console.log('Found temporary items, syncing...')
        syncData()
      }
    }
  }, [isOnline, user, authLoading])

  const loadUserData = async () => {
    if (!user || !isOnline) return

    try {
      setSyncStatus('syncing')
      setSyncError(null)

      console.log('Loading user data from server...') // Debug log

      const [serverFolders, serverNotes] = await Promise.all([
        userDataService.getFolders(),
        userDataService.getNotes()
      ])

      console.log('Server data loaded:', { 
        folders: serverFolders.length, 
        notes: serverNotes.length 
      }) // Debug log

      // Convert server data to local format
      const convertedFolders = userDataService.convertServerFolders(serverFolders)
      const convertedNotes = userDataService.convertServerNotes(serverNotes)

      // Siempre actualizar con los datos del servidor si están disponibles
      // Esto asegura que los datos se sincronicen correctamente
      setLocalFolders(convertedFolders)
      setLocalNotes(convertedNotes)
      console.log('Server data applied to local state:', {
        folders: convertedFolders.length,
        notes: convertedNotes.length
      })
      
      setLastSync(new Date())
      setSyncStatus('success')
    } catch (error) {
      console.error('Error loading user data:', error)
      setSyncError(error.message)
      setSyncStatus('error')
      // En caso de error, mantener datos locales
    }
  }

  const syncData = async () => {
    if (!user || !isOnline) return

    try {
      setSyncStatus('syncing')
      setSyncError(null)

      console.log('Starting sync process...')
      
      // Filtrar elementos con IDs temporales para sincronizar
      const foldersToSync = localFolders.filter(f => !f.id.toString().startsWith('temp_'))
      const notesToSync = localNotes.filter(n => !n.id.toString().startsWith('temp_'))
      
      console.log('Syncing data:', {
        folders: foldersToSync.length,
        notes: notesToSync.length
      })

      const syncResults = await userDataService.syncUserData(foldersToSync, notesToSync)
      
      if (syncResults.errors.length > 0) {
        console.warn('Sync completed with errors:', syncResults.errors)
      }

      console.log('Sync results:', syncResults)

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
    // Generar un ID temporal único para la carpeta local
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const folderWithTempId = { ...folder, id: tempId }
    
    // Siempre agregar a local primero para feedback inmediato
    setLocalFolders(prev => [...prev, folderWithTempId])
    
    if (isOnline && user) {
      try {
        console.log('Syncing folder to server:', folderWithTempId)
        const serverFolder = await userDataService.createFolder(folderWithTempId)
        const convertedFolder = userDataService.convertServerFolders([serverFolder])[0]
        
        // Actualizar con el ID del servidor
        setLocalFolders(prev => 
          prev.map(f => f.id === tempId ? convertedFolder : f)
        )
        console.log('Folder synced to server successfully:', convertedFolder.id)
        
        // Forzar sincronización después de crear
        setTimeout(() => {
          syncData()
        }, 1000)
      } catch (error) {
        console.error('Error syncing folder to server:', error)
        // Mantener la carpeta local aunque falle en el servidor
      }
    }
  }

  const updateFolder = async (folderId, updates) => {
    // Actualizar local primero para feedback inmediato
    setLocalFolders(prev => 
      prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
          : folder
      )
    )
    
    if (isOnline && user) {
      try {
        await userDataService.updateFolder(folderId, updates)
        console.log('Folder updated on server:', folderId)
      } catch (error) {
        console.error('Error updating folder on server:', error)
        // Los datos locales ya están actualizados
      }
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
    console.log('=== CREATE NOTE CALLED ===')
    console.log('Note data:', note)
    console.log('Is online:', isOnline)
    console.log('User:', user ? 'authenticated' : 'not authenticated')
    
    // Generar un ID único para la nota local
    const noteId = Date.now() + Math.random().toString(36).substr(2, 9)
    const noteWithId = { 
      ...note, 
      id: noteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('Note with ID:', noteWithId)
    
    // Siempre agregar a local primero para feedback inmediato
    setLocalNotes(prev => {
      const newNotes = [noteWithId, ...prev]
      console.log('Updated local notes:', newNotes)
      return newNotes
    })
    console.log('Note created locally:', noteWithId)
    
    if (isOnline && user) {
      try {
        console.log('Attempting to sync note to server...')
        const serverNote = await userDataService.createNote(noteWithId)
        console.log('Server response:', serverNote)
        const convertedNote = userDataService.convertServerNotes([serverNote])[0]
        console.log('Converted note:', convertedNote)
        
        // Actualizar con el ID del servidor
        setLocalNotes(prev => 
          prev.map(n => n.id === noteId ? convertedNote : n)
        )
        console.log('Note synced to server successfully:', convertedNote.id)
        
        // Forzar sincronización después de crear
        setTimeout(() => {
          console.log('Running delayed sync...')
          syncData()
        }, 1000)
        
        return convertedNote
      } catch (error) {
        console.error('Error syncing note to server:', error)
        console.log('Note will remain local only')
        // Mantener la nota local aunque falle en el servidor
        return noteWithId
      }
    } else {
      console.log('Note saved locally (offline or not authenticated)')
      return noteWithId
    }
  }

  const updateNote = async (noteId, updates) => {
    // Actualizar local primero para feedback inmediato
    setLocalNotes(prev => 
      prev.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    )
    
    if (isOnline && user) {
      try {
        await userDataService.updateNote(noteId, updates)
        console.log('Note updated on server:', noteId)
        
        // Forzar sincronización después de actualizar
        setTimeout(() => {
          syncData()
        }, 1000)
      } catch (error) {
        console.error('Error updating note on server:', error)
        // Los datos locales ya están actualizados
      }
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
