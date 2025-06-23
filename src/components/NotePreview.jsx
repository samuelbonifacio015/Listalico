import { useState, useEffect } from 'react'
import { X, Save, Edit, FileText, Tag, Clock, Folder, AlertCircle, Star, Hash, Trash2 } from 'lucide-react'

const NotePreview = ({ note, notes, setNotes, folders, setFolders, onEdit, onClose, onDelete = () => {} }) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isEditing, setIsEditing] = useState(true)
  const [isMarkdown, setIsMarkdown] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setIsEditing(true)
    }
  }, [note])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric'
    }
    
    return date.toLocaleDateString('es-ES', options)
  }

  const saveNote = () => {
    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    const updatedNote = {
      ...note,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    }

    setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n))
  }

  useEffect(() => {
    if (note && (title !== note.title || content !== note.content)) {
      const timeoutId = setTimeout(() => {
        if (title.trim()) {
          saveNote()
        }
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [title, content])

  const cancelEdit = () => {
    setTitle(note.title)
    setContent(note.content)
    setIsEditing(true)
  }

  const getPriorityIcon = (priorityLevel) => {
    switch (priorityLevel) {
      case 'high':
        return <AlertCircle size={14} className="priority-icon high" />
      case 'medium':
        return <Clock size={14} className="priority-icon medium" />
      case 'low':
        return <Star size={14} className="priority-icon low" />
      default:
        return <Clock size={14} className="priority-icon medium" />
    }
  }

  const getPriorityText = (priorityLevel) => {
    switch (priorityLevel) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'Media'
    }
  }

  const getFolderName = () => {
    const folder = folders.find(f => f.id === note.folderId)
    return folder ? folder.name : 'Sin carpeta'
  }

  if (!note) return null

  return (
    <div className="note-preview">
      <div className="preview-header">
        <div className="header-left">
          <h3>{title || 'Nueva Nota'}</h3>
          {note.isTask && <span className="task-badge">Tarea</span>}
          {isMarkdown && <span className="markdown-badge">Markdown</span>}
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setIsMarkdown(!isMarkdown)}
            className={`btn btn-format ${isMarkdown ? 'active' : ''}`} 
            title="Activar formato Markdown"
          >
            <Hash size={16} />
          </button>
          <button onClick={onEdit} className="btn btn-expand" title="Edición avanzada">
            <FileText size={16} />
          </button>
          <button 
            onClick={onDelete} 
            className="btn btn-delete" 
            title="Mover a papelera"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="btn btn-close" title="Cerrar">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="preview-content">
        <div className="note-meta">
          <div className="meta-item">
            {getPriorityIcon(note.priority)}
            <span>{getPriorityText(note.priority)}</span>
          </div>
          <div className="meta-item">
            <Folder size={14} />
            <span>{getFolderName()}</span>
          </div>
          {note.categories && note.categories.length > 0 && (
            <div className="meta-item">
              <Tag size={14} />
              <span>{note.categories.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="note-title-section">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input-preview"
            placeholder="Título de la nota..."
          />
        </div>

        <div className="note-content-section">
          {isMarkdown ? (
            <div className="markdown-editor-container">
              <div className="markdown-editor-pane">
                <h4>Editor:</h4>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="content-textarea-preview markdown"
                  placeholder="Escribe en Markdown...\n\n# Título\n## Subtítulo\n- Lista\n**Negrita**\n*Cursiva*"
                  rows={20}
                />
              </div>
              
              <div className="markdown-preview-pane">
                <h4>Vista previa:</h4>
                <div className="preview-content-md" dangerouslySetInnerHTML={{
                  __html: content
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/^\- (.*$)/gim, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                    .replace(/\n/gim, '<br>')
                }} />
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-textarea-preview"
              placeholder="Escribe tu nota aquí..."
              rows={25}
            />
          )}
        </div>

        <div className="note-info-preview">
          <div className="info-row">
            <span className="info-label">Creada:</span>
            <span className="info-value">{formatDateTime(note.createdAt)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Modificada:</span>
            <span className="info-value">{formatDateTime(note.updatedAt)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Caracteres:</span>
            <span className="info-value">{content.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotePreview 