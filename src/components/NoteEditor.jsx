import { useState, useEffect } from 'react'
import { X, Save, CheckSquare, Square, Tag, AlertCircle, Clock, Star, Folder } from 'lucide-react'

const NoteEditor = ({ note, notes, setNotes, folders, onClose }) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isTask, setIsTask] = useState(note?.isTask || false)
  const [priority, setPriority] = useState(note?.priority || 'medium')
  const [categories, setCategories] = useState(note?.categories || [])
  const [newCategory, setNewCategory] = useState('')
  const [folderId, setFolderId] = useState(note?.folderId || null)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setIsTask(note.isTask)
      setPriority(note.priority)
      setCategories(note.categories)
      setFolderId(note.folderId)
    }
  }, [note])

  const saveNote = () => {
    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    const updatedNote = {
      ...note,
      title: title.trim(),
      content: content.trim(),
      isTask,
      priority,
      categories,
      folderId,
      updatedAt: new Date().toISOString()
    }

    setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n))
    onClose()
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeCategory = (categoryToRemove) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      saveNote()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, content, isTask, priority, categories, folderId])

  const getPriorityIcon = (priorityLevel) => {
    switch (priorityLevel) {
      case 'high':
        return <AlertCircle size={16} />
      case 'medium':
        return <Clock size={16} />
      case 'low':
        return <Star size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const getSelectedFolderName = () => {
    const folder = folders.find(f => f.id === folderId)
    return folder ? folder.name : 'Sin carpeta'
  }

  return (
    <div className="note-editor-overlay">
      <div className="note-editor">
        <div className="editor-header">
          <div className="header-left">
            <h2>{note.id ? 'Editar Nota' : 'Nueva Nota'}</h2>
          </div>
          
          <div className="header-actions">
            <button onClick={saveNote} className="btn btn-primary">
              <Save size={16} />
              Guardar
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="editor-body">
          <div className="editor-main">
            <div className="title-section">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota..."
                className="title-input"
                autoFocus
              />
              
              <div className="note-type-toggle">
                <button
                  onClick={() => setIsTask(!isTask)}
                  className={`type-toggle ${isTask ? 'active' : ''}`}
                >
                  {isTask ? <CheckSquare size={16} /> : <Square size={16} />}
                  {isTask ? 'Tarea' : 'Nota'}
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              className="content-textarea"
              rows={15}
            />
          </div>

          <div className="editor-sidebar">
            <div className="editor-section">
              <h3 className="section-title">
                <Folder size={16} />
                Carpeta
              </h3>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="folder-select"
              >
                <option value="">Sin carpeta</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="editor-section">
              <h3 className="section-title">
                {getPriorityIcon(priority)}
                Prioridad
              </h3>
              <div className="priority-options">
                <button
                  onClick={() => setPriority('high')}
                  className={`priority-btn high ${priority === 'high' ? 'active' : ''}`}
                >
                  <AlertCircle size={14} />
                  Alta
                </button>
                <button
                  onClick={() => setPriority('medium')}
                  className={`priority-btn medium ${priority === 'medium' ? 'active' : ''}`}
                >
                  <Clock size={14} />
                  Media
                </button>
                <button
                  onClick={() => setPriority('low')}
                  className={`priority-btn low ${priority === 'low' ? 'active' : ''}`}
                >
                  <Star size={14} />
                  Baja
                </button>
              </div>
            </div>

            <div className="editor-section">
              <h3 className="section-title">
                <Tag size={16} />
                Categorías
              </h3>
              
              <div className="add-category">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCategory()
                    }
                  }}
                  placeholder="Agregar categoría..."
                  className="category-input"
                />
                <button onClick={addCategory} className="add-category-btn">
                  +
                </button>
              </div>

              <div className="categories-list">
                {categories.map((category, index) => (
                  <div key={index} className="category-item">
                    <span className="category-name">{category}</span>
                    <button
                      onClick={() => removeCategory(category)}
                      className="remove-category-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <h3 className="section-title">Información</h3>
              <div className="note-info">
                <div className="info-item">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value">{isTask ? 'Tarea' : 'Nota'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Carpeta:</span>
                  <span className="info-value">{getSelectedFolderName()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Creada:</span>
                  <span className="info-value">
                    {new Date(note.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Modificada:</span>
                  <span className="info-value">
                    {new Date(note.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <div className="footer-info">
            <span className="save-shortcut">
              Ctrl+Enter para guardar • Esc para cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditor 