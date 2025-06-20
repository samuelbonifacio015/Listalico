import { CheckSquare, Square, AlertCircle, Clock, Star, Trash2 } from 'lucide-react'

const NotesList = ({ notes, selectedNote, setSelectedNote, setShowNoteEditor, setNotes }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Hace un momento'
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`
    } else if (diffInHours < 48) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
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
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No hay notas</h3>
          <p>Crea tu primera nota para empezar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notes-list">
      <div className="notes-header">
        <h2 className="notes-title">
          {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
        </h2>
      </div>

      <div className="notes-container">
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className={`note-item ${selectedNote === note.id ? 'selected' : ''} ${note.completed ? 'completed' : ''}`}
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
                    className="task-checkbox"
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
              <p className="note-preview">{getPreviewText(note.content)}</p>
            )}

            <div className="note-meta">
              <div className="note-details">
                {note.isTask && (
                  <span className="note-type">Tarea</span>
                )}
                
                {note.priority && (
                  <span className={`priority-badge ${note.priority}`}>
                    {getPriorityText(note.priority)}
                  </span>
                )}

                {note.categories.length > 0 && (
                  <div className="categories">
                    {note.categories.slice(0, 2).map((category, index) => (
                      <span key={index} className="category-tag">
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

              <time className="note-date" title={new Date(note.updatedAt).toLocaleString('es-ES')}>
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