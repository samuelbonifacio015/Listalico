import { useState } from 'react'
import { Plus, Search, FolderPlus, Download, Upload, Trash2 } from 'lucide-react'
import Sidebar from './components/Sidebar'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import NotePreview from './components/NotePreview'
import ConfirmModal from './components/ConfirmModal'
import { useLocalStorage } from './hooks/useLocalStorage'

function App() {
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
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?.id || null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  
  // Estados para el modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'default'
  })

  // Filtrar notas por carpeta seleccionada y término de búsqueda
  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolder ? note.folderId === selectedFolder : true
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.categories && note.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())))
    return matchesFolder && matchesSearch
  })

  const createNewNote = () => {
    // Si no hay carpeta seleccionada, crear en la primera carpeta disponible
    const targetFolderId = selectedFolder || folders[0]?.id || null
    
    const newNote = {
      id: Date.now(),
      title: 'Nueva Nota',
      content: '',
      folderId: targetFolderId,
      priority: 'medium',
      categories: [],
      isTask: false,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote.id)
    setShowPreview(true)
    setShowNoteEditor(false)
  }

  const createNewFolder = () => {
    const newFolder = {
      id: Date.now(),
      name: 'Nueva Carpeta',
      color: '#666666',
      notes: []
    }
    setFolders(prev => [...prev, newFolder])
  }

  const moveToTrash = (folder) => {
    const deletedFolder = {
      ...folder,
      deletedAt: new Date().toISOString()
    }
    setDeletedFolders(prev => [...prev, deletedFolder])
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    
    // También mover las notas de la carpeta eliminada a papelera
    const folderNotes = notes.filter(note => note.folderId === folder.id)
    folderNotes.forEach(note => {
      const deletedNote = {
        ...note,
        deletedAt: new Date().toISOString(),
        originalFolderId: note.folderId
      }
      setDeletedNotes(prev => [...prev, deletedNote])
    })
    setNotes(prev => prev.filter(note => note.folderId !== folder.id))
    
    if (selectedFolder === folder.id) {
      setSelectedFolder(null)
    }
  }

  const moveNoteToTrash = (noteId) => {
    const noteToDelete = notes.find(note => note.id === noteId)
    if (noteToDelete) {
      const deletedNote = {
        ...noteToDelete,
        deletedAt: new Date().toISOString(),
        originalFolderId: noteToDelete.folderId
      }
      setDeletedNotes(prev => [...prev, deletedNote])
      setNotes(prev => prev.filter(note => note.id !== noteId))
      
      if (selectedNote === noteId) {
        setSelectedNote(null)
        setShowPreview(false)
        setShowNoteEditor(false)
      }
    }
  }

  const restoreFromTrash = (folderId) => {
    const folderToRestore = deletedFolders.find(f => f.id === folderId)
    if (folderToRestore) {
      const { deletedAt, ...restoredFolder } = folderToRestore
      setFolders(prev => [...prev, restoredFolder])
      setDeletedFolders(prev => prev.filter(f => f.id !== folderId))
    }
  }

  const restoreNoteFromTrash = (noteId) => {
    const noteToRestore = deletedNotes.find(note => note.id === noteId)
    if (noteToRestore) {
      const { deletedAt, originalFolderId, ...restoredNote } = noteToRestore
      setNotes(prev => [...prev, restoredNote])
      setDeletedNotes(prev => prev.filter(note => note.id !== noteId))
    }
  }

  const permanentlyDelete = (folderId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar permanentemente',
      message: '¿Estás seguro de que quieres eliminar permanentemente esta carpeta? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: () => {
        setDeletedFolders(prev => prev.filter(f => f.id !== folderId))
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    })
  }

  const permanentlyDeleteNote = (noteId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar permanentemente',
      message: '¿Estás seguro de que quieres eliminar permanentemente esta nota? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: () => {
        setDeletedNotes(prev => prev.filter(note => note.id !== noteId))
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    })
  }

  const confirmDeleteNote = (noteId) => {
    const note = notes.find(n => n.id === noteId)
    const folderName = folders.find(f => f.id === note?.folderId)?.name || 'Sin carpeta'
    
    setConfirmModal({
      isOpen: true,
      title: 'Mover a papelera',
      message: `¿Estás seguro de que quieres enviar la nota "${note?.title}" (${folderName}) a la papelera?`,
      type: 'danger',
      confirmText: 'Mover a papelera',
      onConfirm: () => {
        moveNoteToTrash(noteId)
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    })
  }

  const confirmDeleteFolder = (folder) => {
    const notesCount = notes.filter(note => note.folderId === folder.id).length
    const message = notesCount > 0 
      ? `¿Estás seguro de que quieres enviar la carpeta "${folder.name}" y sus ${notesCount} nota(s) a la papelera?`
      : `¿Estás seguro de que quieres enviar la carpeta "${folder.name}" a la papelera?`
    
    setConfirmModal({
      isOpen: true,
      title: 'Mover a papelera',
      message,
      type: 'danger',
      confirmText: 'Mover a papelera',
      onConfirm: () => {
        moveToTrash(folder)
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    })
  }

  const exportData = () => {
    try {
      const data = {
        folders,
        notes,
        deletedFolders,
        deletedNotes,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        appName: 'Listalico'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listalico-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Datos exportados correctamente')
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al exportar los datos')
    }
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        // Validar estructura del archivo
        if (!data.folders || !data.notes || !Array.isArray(data.folders) || !Array.isArray(data.notes)) {
          alert('El archivo no tiene el formato correcto de Listalico')
          return
        }

        // Mostrar diálogo de confirmación
        const confirmMessage = `¿Estás seguro de que quieres importar estos datos?\n\n` +
                              `Carpetas: ${data.folders.length}\n` +
                              `Notas: ${data.notes.length}\n` +
                              `Papelera: ${(data.deletedFolders?.length || 0) + (data.deletedNotes?.length || 0)}\n\n` +
                              `Esto reemplazará todos tus datos actuales.`

        if (!window.confirm(confirmMessage)) {
          return
        }

        setFolders(data.folders)
        setNotes(data.notes)
        setDeletedFolders(data.deletedFolders || [])
        setDeletedNotes(data.deletedNotes || [])
        setSelectedFolder(data.folders[0]?.id || null)
        setSelectedNote(null)
        setShowNoteEditor(false)
        alert('Datos importados correctamente')
      } catch (error) {
        console.error('Error al importar:', error)
        alert('Error al importar el archivo. Asegúrate de que sea un archivo JSON válido de Listalico.')
      }
    }
    reader.readAsText(file)
    
    // Limpiar el input
    event.target.value = ''
  }

  // Función para mover nota a carpeta (drag and drop)
  const moveNoteToFolder = (noteId, targetFolderId) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, folderId: targetFolderId, updatedAt: new Date().toISOString() }
        : note
    ))
  }

  const handleNoteSelect = (noteId) => {
    setSelectedNote(noteId)
    setShowPreview(true)
    setShowNoteEditor(false)
  }

  const handleNoteDoubleClick = (noteId) => {
    setSelectedNote(noteId)
    setShowNoteEditor(true)
    setShowPreview(false)
  }

  const toggleFolderExpansion = (folderId) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return newExpanded
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false })
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <h1 className="app-title">Listalico</h1>
          <div className="search-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={exportData} className="btn btn-secondary" title="Exportar datos">
            <Download size={16} />
          </button>
          <label className="btn btn-secondary" title="Importar datos">
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="app-body">
        <Sidebar
          folders={folders}
          setFolders={setFolders}
          deletedFolders={deletedFolders}
          deletedNotes={deletedNotes}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          notes={notes}
          showTrash={showTrash}
          setShowTrash={setShowTrash}
          moveToTrash={confirmDeleteFolder}
          restoreFromTrash={restoreFromTrash}
          restoreNoteFromTrash={restoreNoteFromTrash}
          permanentlyDelete={permanentlyDelete}
          permanentlyDeleteNote={permanentlyDeleteNote}
          createNewFolder={createNewFolder}
          createNewNote={createNewNote}
          moveNoteToFolder={moveNoteToFolder}
          expandedFolders={expandedFolders}
          toggleFolderExpansion={toggleFolderExpansion}
          onNoteSelect={handleNoteSelect}
          selectedNote={selectedNote}
        />
        
        <div className="main-content">
          <NotesList
            notes={filteredNotes}
            selectedNote={selectedNote}
            setSelectedNote={handleNoteSelect}
            setShowNoteEditor={setShowNoteEditor}
            onNoteDoubleClick={handleNoteDoubleClick}
            setNotes={setNotes}
            folders={folders}
            showPreview={showPreview}
            onDeleteNote={confirmDeleteNote}
          />
          
          {showPreview && selectedNote && (
            <NotePreview
              note={notes.find(n => n.id === selectedNote)}
              notes={notes}
              setNotes={setNotes}
              folders={folders}
              setFolders={setFolders}
              onEdit={() => {
                setShowNoteEditor(true)
                setShowPreview(false)
              }}
              onClose={() => {
                setShowPreview(false)
                setSelectedNote(null)
              }}
              onDelete={() => confirmDeleteNote(selectedNote)}
            />
          )}
          
          {showNoteEditor && selectedNote && (
            <NoteEditor
              note={notes.find(n => n.id === selectedNote)}
              notes={notes}
              setNotes={setNotes}
              folders={folders}
              setFolders={setFolders}
              onClose={() => {
                setShowNoteEditor(false)
                setShowPreview(true)
              }}
              onDelete={() => confirmDeleteNote(selectedNote)}
            />
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText="Cancelar"
      />
    </div>
  )
}

export default App
