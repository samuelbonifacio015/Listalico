import { CheckSquare, Square, AlertCircle, Clock, Star, Trash2, Plus, FileText, Sparkles, Search, Calendar, Tag, CheckCircle, Circle, Folder } from 'lucide-react'
import { useState } from 'react'

const NotesList = ({ notes, selectedNote, setSelectedNote, setShowNoteEditor, onNoteDoubleClick, setNotes, folders, showPreview, onDeleteNote = () => {} }) => {
  const [draggedNote, setDraggedNote] = useState(null)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterBy, setFilterBy] = useState('all')

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Hoy'
    if (diffDays === 2) return 'Ayer'
    if (diffDays <= 7) return `Hace ${diffDays - 1} días`
    
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    })
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={14} className="priority-icon high" />
      case 'medium':
        return <Clock size={14} className="priority-icon medium" />
      case 'low':
        return <Star size={14} className="priority-icon low" />
      default:
        return null
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'Sin prioridad'
    }
  }

  const toggleTask = (noteId) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, completed: !note.completed, updatedAt: new Date().toISOString() }
        : note
    ))
  }

  const deleteNote = (noteId, e) => {
    e.stopPropagation()
    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId))
      if (selectedNote === noteId) {
        setSelectedNote(null)
      }
    }
  }

  const openNote = (note) => {
    setSelectedNote(note.id)
  }

  const handleDoubleClick = (note, e) => {
    e.stopPropagation()
    if (onNoteDoubleClick) {
      onNoteDoubleClick(note.id)
    }
  }

  // Funciones de drag and drop
  const handleDragStart = (e, note) => {
    setDraggedNote(note)
    e.dataTransfer.setData('text/plain', note.id.toString())
    e.dataTransfer.effectAllowed = 'move'
    
    // Agregar clase visual
    setTimeout(() => {
      if (e.target) {
        e.target.classList.add('dragging')
      }
    }, 0)
  }

  const handleDragEnd = (e) => {
    setDraggedNote(null)
    e.target.classList.remove('dragging')
  }

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Nueva Nota',
      content: '',
      folderId: null,
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

  const getPreviewText = (content) => {
    if (!content) return 'Sin contenido'
    return content.length > 80 ? content.substring(0, 80) + '...' : content
  }

  const getFolderName = (folderId) => {
    if (!folderId) return 'Sin carpeta'
    const folder = folders?.find(f => f.id === folderId)
    return folder ? folder.name : 'Sin carpeta'
  }

  const getFolderColor = (folderId) => {
    if (!folderId) return '#666666'
    const folder = folders.find(f => f.id === folderId)
    return folder?.color || '#666666'
  }

  const sortedAndFilteredNotes = notes
    .filter(note => {
      if (filterBy === 'tasks') return note.isTask
      if (filterBy === 'completed') return note.isTask && note.completed
      if (filterBy === 'pending') return note.isTask && !note.completed
      if (filterBy === 'notes') return !note.isTask
      return true
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title) * multiplier
      }
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return (new Date(a[sortBy]) - new Date(b[sortBy])) * multiplier
      }
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * multiplier
      }
      return 0
    })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff453a'
      case 'medium': return '#ff9500'
      case 'low': return '#34c759'
      default: return '#8e8e93'
    }
  }

  if (notes.length === 0) {
    return (
      <div className="notes-list empty">
        <div className="empty-state enhanced">
          <div className="welcome-animation">
            <div className="floating-icons">
              <FileText className="icon-1" size={24} />
              <Plus className="icon-2" size={20} />
              <Sparkles className="icon-3" size={18} />
            </div>
          </div>
          
          <div className="welcome-content">
            <h3>¡Bienvenido a Listalico! 🚀</h3>
            <p>Tu espacio personal para organizar ideas, tareas y proyectos</p>
            
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📝</div>
                <span>Notas rápidas</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✅</div>
                <span>Lista de tareas</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📁</div>
                <span>Organiza en carpetas</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎨</div>
                <span>Personaliza colores</span>
              </div>
            </div>
            
            <button 
              onClick={createNewNote}
              className="btn-start-journey"
            >
              <Plus size={16} />
              Crear mi primera nota
            </button>
            
            <div className="tips">
              <p className="tip">💡 <strong>Tip:</strong> Usa <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para guardar rápidamente</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`notes-list ${showPreview ? 'with-preview' : 'no-preview'}`}>
      <div className="notes-header enhanced">
        <div className="header-content">
          <h2 className="notes-title">
            <span className="notes-count">{sortedAndFilteredNotes.length}</span>
            <span className="notes-label">{sortedAndFilteredNotes.length === 1 ? 'nota' : 'notas'}</span>
          </h2>
          
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{notes.filter(n => n.isTask && !n.completed).length}</span>
              <span className="stat-label">pendientes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{notes.filter(n => n.isTask && n.completed).length}</span>
              <span className="stat-label">completadas</span>
            </div>
          </div>
        </div>

        <div className="notes-controls">
          <div className="filter-controls">
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas</option>
              <option value="notes">Solo Notas</option>
              <option value="tasks">Solo Tareas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>

            <select 
              value={`${sortBy}-${sortOrder}`} 
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="sort-select"
            >
              <option value="updatedAt-desc">Más recientes</option>
              <option value="updatedAt-asc">Más antiguas</option>
              <option value="title-asc">A-Z</option>
              <option value="title-desc">Z-A</option>
              <option value="priority-desc">Prioridad alta</option>
              <option value="priority-asc">Prioridad baja</option>
            </select>
          </div>
        </div>
      </div>

      <div className="notes-container enhanced">
        {sortedAndFilteredNotes.map(note => (
          <div
            key={note.id}
            className={`note-item enhanced ${selectedNote === note.id ? 'selected' : ''} ${note.completed ? 'completed' : ''}`}
            onClick={() => openNote(note)}
            onDoubleClick={(e) => handleDoubleClick(note, e)}
            draggable
            onDragStart={(e) => handleDragStart(e, note)}
            onDragEnd={handleDragEnd}
          >
            <div className="note-header">
              <div className="note-title-section">
                {note.isTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(note.id)
                    }}
                    className="task-checkbox enhanced"
                  >
                    {note.completed ? 
                      <CheckSquare size={16} className="checked" /> : 
                      <Square size={16} />
                    }
                  </button>
                )}
                
                <h3 className="note-title">{note.title}</h3>
              </div>

              <div className="note-actions">
                {getPriorityIcon(note.priority)}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteNote(note.id)
                  }}
                  className="delete-btn"
                  title="Eliminar nota"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {note.content && (
              <p className="note-preview enhanced">{getPreviewText(note.content)}</p>
            )}

            <div className="note-meta enhanced">
              <div className="note-details">
                {note.isTask && (
                  <span className="note-type enhanced">Tarea</span>
                )}
                
                {note.priority && (
                  <span className={`priority-badge enhanced ${note.priority}`}>
                    {getPriorityText(note.priority)}
                  </span>
                )}

                <span className="folder-badge enhanced">
                  📁 {getFolderName(note.folderId)}
                </span>

                {note.categories.length > 0 && (
                  <div className="categories enhanced">
                    {note.categories.slice(0, 2).map((category, index) => (
                      <span key={index} className="category-tag enhanced">
                        {category}
                      </span>
                    ))}
                    {note.categories.length > 2 && (
                      <span className="category-more">
                        +{note.categories.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <time className="note-date enhanced" title={new Date(note.updatedAt).toLocaleString('es-ES')}>
                {formatDate(note.updatedAt)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotesList 