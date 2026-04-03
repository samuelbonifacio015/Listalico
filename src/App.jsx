import { useState } from 'react'
import { Plus, Search, FolderPlus, Download, Upload, Trash2, Sparkles, BookOpen, Github, Heart, Menu, X, Home, Mic } from 'lucide-react'
import Sidebar from './components/Sidebar'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import NotePreview from './components/NotePreview'
import ConfirmModal from './components/ConfirmModal'
import DictationPage from './components/DictationPage'
import { useUserData } from './hooks/useUserData'

function App() {
  const {
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
  } = useUserData()
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?.id || null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDictationPage, setShowDictationPage] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  

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

  const createNewNote = async () => {
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
    
    try {
      await createNote(newNote)
      setSelectedNote(newNote.id)
      setShowPreview(true)
      setShowNoteEditor(false)
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const createNewFolder = async () => {
    const newFolder = {
      id: Date.now(),
      name: 'Nueva Carpeta',
      color: '#666666',
      notes: []
    }
    
    try {
      await createFolder(newFolder)
    } catch (error) {
      console.error('Error creating folder:', error)
    }
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
      <div className="app-header app-header--refactored">
        <div className="header-left">
          <div className="app-title-container">
            <div className="app-logo">
              <BookOpen size={24} className="logo-icon" />
              <Sparkles size={16} className="sparkle-icon" />
            </div>
            <h1 className="app-title">
              Listalico
              <span className="title-subtitle">Tu espacio de notas</span>
            </h1>
          </div>
        </div>

        <div className="header-center">
          <div className="search-container search-container--enhanced">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar en tus notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={createNewNote}
            className="btn btn-primary create-note-btn"
            title="Nueva nota"
          >
            <Plus size={18} />
            <span className="btn-text">Nueva nota</span>
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            title="Menú"
            aria-label={showMobileMenu ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      <div className={`mobile-overlay-menu ${showMobileMenu ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h2 className="app-title">Menú</h2>
          <button onClick={() => setShowMobileMenu(false)} className="btn hover-lift" style={{background: 'transparent', color: 'white', border: 'none'}}>
            <X size={24} />
          </button>
        </div>
        
        <div className="stagger-item">
          <button 
            onClick={() => {
              createNewFolder()
              setShowMobileMenu(false)
            }} 
            className="overlay-action-btn"
          >
            <FolderPlus size={20} />
            Nueva Carpeta
          </button>
        </div>

        <div className="stagger-item">
          <button 
            onClick={() => {
              exportData()
              setShowMobileMenu(false)
            }} 
            className="overlay-action-btn"
          >
            <Download size={20} />
            Exportar datos
          </button>
        </div>

        <div className="stagger-item">
          <label className="overlay-action-btn" style={{cursor: 'pointer'}}>
            <Upload size={20} />
            Importar datos
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                importData(e)
                setShowMobileMenu(false)
              }}
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
          openDictation={() => {
            setShowDictationPage(true)
            setShowNoteEditor(false)
            setShowPreview(false)
          }}
          moveNoteToFolder={moveNoteToFolder}
          expandedFolders={expandedFolders}
          toggleFolderExpansion={toggleFolderExpansion}
          onNoteSelect={handleNoteSelect}
          selectedNote={selectedNote}
        />
        
        <div className="main-content">
          {showDictationPage ? (
            <DictationPage
              folders={folders}
              selectedFolder={selectedFolder}
              onSave={async (dictatedNote) => {
                const targetFolderId = dictatedNote.folderId || selectedFolder || folders[0]?.id || null;
                const newNote = {
                  ...dictatedNote,
                  id: Date.now(),
                  folderId: targetFolderId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                try {
                  await createNote(newNote);
                  setSelectedNote(newNote.id);
                  setShowPreview(true);
                  setShowNoteEditor(false);
                  setShowDictationPage(false);
                } catch (error) {
                  console.error('Error creating dictation note:', error);
                }
              }}
              onClose={() => setShowDictationPage(false)}
            />
          ) : (
            <>
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
            </>
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

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-text">desarrollado por samuelbonifacio</span>
            <Heart size={14} className="heart-icon" />
          </div>
          <div className="footer-right">
            <a 
              href="https://github.com/samuelbonifacio015/Listalico/tree/main" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
              title="Ver código fuente en GitHub"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Bar (Mobile Only via CSS) */}
      <div className="mobile-bottom-bar">
        <button 
          className="nav-item" 
          onClick={() => {
            setShowNoteEditor(false)
            setShowDictationPage(false)
            setShowPreview(false)
          }}
        >
          <Home size={20} />
          <span>Inicio</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => {
            document.querySelector('.search-input')?.focus()
          }}
        >
          <Search size={20} />
          <span>Buscar</span>
        </button>
        <button 
          className="nav-item primary-action"
          onClick={createNewNote}
        >
          <Plus size={24} />
        </button>
        <button 
          className="nav-item"
          onClick={() => {
            setShowDictationPage(true)
            setShowNoteEditor(false)
            setShowPreview(false)
          }}
        >
          <Mic size={20} />
          <span>Dictado</span>
        </button>
        <button 
          className={`nav-item ${showMobileMenu ? 'active' : ''}`}
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Menu size={20} />
          <span>Menú</span>
        </button>
      </div>
    </div>
  )
}

export default App
