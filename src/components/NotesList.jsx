import { CheckSquare, Square, AlertCircle, Clock, Star, Trash2, Plus, FileText, Sparkles } from 'lucide-react'

const NotesList = ({ notes, selectedNote, setSelectedNote, setShowNoteEditor, setNotes }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    // Agregar año solo si es diferente al actual
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric'
    }
    
    return date.toLocaleDateString('es-ES', options)
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
    setShowNoteEditor(true)
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
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ')
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
  }

  const sortedNotes = [...notes].sort((a, b) => {
    // Primero por completado (tareas incompletas primero)
    if (a.isTask && b.isTask) {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
    }
    
    // Luego por prioridad
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority] || 0
    const bPriority = priorityOrder[b.priority] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Finalmente por fecha de actualización (más reciente primero)
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

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
    <div className="notes-list">
      <div className="notes-header enhanced">
        <div className="header-content">
          <h2 className="notes-title">
            <span className="notes-count">{notes.length}</span>
            <span className="notes-label">{notes.length === 1 ? 'nota' : 'notas'}</span>
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
      </div>

      <div className="notes-container enhanced">
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className={`note-item enhanced ${selectedNote === note.id ? 'selected' : ''} ${note.completed ? 'completed' : ''}`}
            onClick={() => openNote(note)}
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
                  onClick={(e) => deleteNote(note.id, e)}
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