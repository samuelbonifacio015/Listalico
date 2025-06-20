import { useState, useEffect } from 'react'
import { Plus, Search, FolderPlus, Download, Upload, Settings } from 'lucide-react'
import Sidebar from './components/Sidebar'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import { useLocalStorage } from './hooks/useLocalStorage'

function App() {
  const [folders, setFolders] = useLocalStorage('listalico-folders', [
    {
      id: 1,
      name: 'Personal',
      color: '#007aff',
      notes: []
    }
  ])
  
  const [notes, setNotes] = useLocalStorage('listalico-notes', [])
  const [selectedFolder, setSelectedFolder] = useState(folders[0]?.id || null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoteEditor, setShowNoteEditor] = useState(false)

  // Filtrar notas por carpeta seleccionada y término de búsqueda
  const filteredNotes = notes.filter(note => {
    const matchesFolder = selectedFolder ? note.folderId === selectedFolder : true
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
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
    const colors = ['#007aff', '#34c759', '#ff9500', '#ff453a', '#af52de', '#5ac8fa']
    const newFolder = {
      id: Date.now(),
      name: 'Nueva Carpeta',
      color: colors[Math.floor(Math.random() * colors.length)],
      notes: []
    }
    setFolders(prev => [...prev, newFolder])
  }

  const exportData = () => {
    const data = {
      folders,
      notes,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
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
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.folders && data.notes) {
          setFolders(data.folders)
          setNotes(data.notes)
          setSelectedFolder(data.folders[0]?.id || null)
          setSelectedNote(null)
          alert('Datos importados correctamente')
        } else {
          alert('El archivo no tiene el formato correcto')
        }
      } catch (error) {
        alert('Error al importar el archivo')
      }
    }
    reader.readAsText(file)
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
          <button onClick={exportData} className="btn btn-secondary" title="Exportar">
            <Download size={16} />
          </button>
          <label className="btn btn-secondary" title="Importar">
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
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          notes={notes}
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
