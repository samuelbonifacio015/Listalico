import { useState } from 'react'
import { Plus, Search, FolderPlus, Download, Upload, Trash2 } from 'lucide-react'
import Sidebar from './components/Sidebar'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
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
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?.id || null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showTrash, setShowTrash] = useState(false)

  // Filtrar notas por carpeta seleccionada y término de búsqueda
  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolder ? note.folderId === selectedFolder : true
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.categories && note.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())))
    return matchesFolder && matchesSearch
  })

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Nueva Nota',
      content: '',
      folderId: selectedFolder,
      priority: 'medium',
      categories: [],
      isTask: false,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote.id)
    setShowNoteEditor(true)
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
    
    // También mover las notas de la carpeta eliminada
    const folderNotes = notes.filter(note => note.folderId === folder.id)
    folderNotes.forEach(() => {
      setNotes(prev => prev.filter(n => n.folderId !== folder.id))
    })
    
    if (selectedFolder === folder.id) {
      setSelectedFolder(null)
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

  const permanentlyDelete = (folderId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar permanentemente esta carpeta? Esta acción no se puede deshacer.')) {
      setDeletedFolders(prev => prev.filter(f => f.id !== folderId))
    }
  }

  const exportData = () => {
    try {
      const data = {
        folders,
        notes,
        deletedFolders,
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
                              `Papelera: ${data.deletedFolders?.length || 0}\n\n` +
                              `Esto reemplazará todos tus datos actuales.`

        if (!window.confirm(confirmMessage)) {
          return
        }

        setFolders(data.folders)
        setNotes(data.notes)
        setDeletedFolders(data.deletedFolders || [])
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
          <button onClick={createNewNote} className="btn btn-primary" title="Nueva Nota">
            <Plus size={16} />
            Nueva Nota
          </button>
          <button onClick={createNewFolder} className="btn btn-secondary" title="Nueva Carpeta">
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={() => setShowTrash(!showTrash)} 
            className={`btn btn-secondary ${showTrash ? 'active' : ''}`} 
            title="Papelera"
          >
            <Trash2 size={16} />
          </button>
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
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          notes={notes}
          showTrash={showTrash}
          moveToTrash={moveToTrash}
          restoreFromTrash={restoreFromTrash}
          permanentlyDelete={permanentlyDelete}
        />
        
        <div className="main-content">
          <NotesList
            notes={filteredNotes}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            setShowNoteEditor={setShowNoteEditor}
            setNotes={setNotes}
          />
          
          {showNoteEditor && selectedNote && (
            <NoteEditor
              note={notes.find(n => n.id === selectedNote)}
              notes={notes}
              setNotes={setNotes}
              folders={folders}
              onClose={() => setShowNoteEditor(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
