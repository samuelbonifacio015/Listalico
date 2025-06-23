import { useState, useEffect } from 'react'
import { X, Save, CheckSquare, Square, Tag, AlertCircle, Clock, Star, Folder, Plus, Download, Upload, FileText, Hash } from 'lucide-react'

const NoteEditor = ({ note, notes, setNotes, folders, setFolders, onClose }) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isTask, setIsTask] = useState(note?.isTask || false)
  const [priority, setPriority] = useState(note?.priority || 'medium')
  const [categories, setCategories] = useState(note?.categories || [])
  const [newCategory, setNewCategory] = useState('')
  const [folderId, setFolderId] = useState(note?.folderId || null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#666666')
  const [isMarkdown, setIsMarkdown] = useState(false)

  const folderColors = [
    '#666666', '#007aff', '#34c759', '#ff9500', '#ff453a', 
    '#af52de', '#5ac8fa', '#ffcc02', '#ff2d92', '#8e8e93'
  ]

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
    
    // Agregar año solo si es diferente al actual
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
      isTask,
      priority,
      categories,
      folderId,
      updatedAt: new Date().toISOString()
    }

    setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n))
    onClose()
  }

  const createFolder = () => {
    if (!newFolderName.trim()) {
      alert('El nombre de la carpeta es obligatorio')
      return
    }

    const newFolder = {
      id: Date.now(),
      name: newFolderName.trim(),
      color: newFolderColor,
      notes: []
    }

    setFolders(prev => [...prev, newFolder])
    setFolderId(newFolder.id)
    setShowNewFolder(false)
    setNewFolderName('')
    setNewFolderColor('#666666')
  }

  const exportAsText = () => {
    const content = `${title}\n${'='.repeat(title.length)}\n\n${content}`
    const blob = new Blob([content], { type: 'text/plain' })
    downloadFile(blob, `${title}.txt`)
  }

  const exportAsMarkdown = () => {
    let mdContent = `# ${title}\n\n`
    
    if (isTask) {
      mdContent += `**Tipo:** Tarea\n`
    }
    
    mdContent += `**Prioridad:** ${getPriorityText(priority)}\n`
    
    if (categories.length > 0) {
      mdContent += `**Categorías:** ${categories.join(', ')}\n`
    }
    
    const folderName = getSelectedFolderName()
    if (folderName !== 'Sin carpeta') {
      mdContent += `**Carpeta:** ${folderName}\n`
    }
    
    mdContent += `**Creada:** ${formatDateTime(note.createdAt)}\n`
    mdContent += `**Modificada:** ${formatDateTime(note.updatedAt)}\n\n`
    mdContent += `---\n\n${content}`
    
    const blob = new Blob([mdContent], { type: 'text/markdown' })
    downloadFile(blob, `${title}.md`)
  }

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importFile = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const fileContent = e.target.result
      const extension = file.name.split('.').pop().toLowerCase()
      
      if (extension === 'txt') {
        const lines = fileContent.split('\n')
        if (lines.length > 0) {
          setTitle(lines[0] || 'Nota importada')
          setContent(lines.slice(1).join('\n').trim())
        }
      } else if (extension === 'md') {
        // Parsear markdown básico
        const lines = fileContent.split('\n')
        let titleFound = false
        let contentStart = 0
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('# ') && !titleFound) {
            setTitle(lines[i].substring(2))
            titleFound = true
            contentStart = i + 1
            break
          }
        }
        
        if (!titleFound && lines.length > 0) {
          setTitle(file.name.replace('.md', ''))
        }
        
        setContent(lines.slice(contentStart).join('\n').trim())
        setIsMarkdown(true)
      }
      
      alert(`Archivo ${file.name} importado correctamente`)
    }
    
    reader.readAsText(file)
    event.target.value = ''
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

  const getPriorityText = (priorityLevel) => {
    switch (priorityLevel) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'Media'
    }
  }

  const getSelectedFolderName = () => {
    const folder = folders.find(f => f.id === folderId)
    return folder ? folder.name : 'Sin carpeta'
  }

  return (
    <div className="note-editor-overlay">
      <div className="note-editor enhanced">
        <div className="editor-header">
          <div className="header-left">
            <div className="editor-title-section">
              <h2>{note.id ? 'Editar Nota' : 'Nueva Nota'}</h2>
              <div className="header-badges">
                {isTask && <span className="badge task-badge">Tarea</span>}
                {isMarkdown && <span className="badge markdown-badge">Markdown</span>}
                <span className={`badge priority-badge ${priority}`}>
                  {getPriorityIcon(priority)}
                  {getPriorityText(priority)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="export-actions">
              <button 
                onClick={exportAsText} 
                className="btn btn-export" 
                title="Exportar como TXT"
              >
                <FileText size={16} />
              </button>
              <button 
                onClick={exportAsMarkdown} 
                className="btn btn-export" 
                title="Exportar como Markdown"
              >
                <Hash size={16} />
              </button>
              <label className="btn btn-export" title="Importar archivo">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={importFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
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
            <div className="title-section enhanced">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota..."
                className="title-input enhanced"
                autoFocus
              />
              
              <div className="editor-toolbar">
                <div className="note-type-toggle">
                  <button
                    onClick={() => setIsTask(!isTask)}
                    className={`type-toggle ${isTask ? 'active' : ''}`}
                  >
                    {isTask ? <CheckSquare size={16} /> : <Square size={16} />}
                    {isTask ? 'Tarea' : 'Nota'}
                  </button>
                </div>
                
                <div className="format-toggle">
                  <button
                    onClick={() => setIsMarkdown(!isMarkdown)}
                    className={`format-btn ${isMarkdown ? 'active' : ''}`}
                    title="Activar formato Markdown"
                  >
                    <Hash size={16} />
                    Markdown
                  </button>
                </div>
              </div>
            </div>

            <div className="content-section">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isMarkdown ? 
                  "Escribe en Markdown...\n\n# Título\n## Subtítulo\n- Lista\n**Negrita**\n*Cursiva*" : 
                  "Escribe tu nota aquí..."
                }
                className={`content-textarea enhanced ${isMarkdown ? 'markdown' : ''}`}
                rows={15}
              />
              
              {isMarkdown && (
                <div className="markdown-preview">
                  <h4>Vista previa:</h4>
                  <div className="preview-content" dangerouslySetInnerHTML={{
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
              )}
            </div>
          </div>

          <div className="editor-sidebar enhanced">
            <div className="editor-section">
              <h3 className="section-title">
                <Folder size={16} />
                Carpeta
              </h3>
              
              <div className="folder-selection">
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                  className="folder-select enhanced"
                >
                  <option value="">Sin carpeta</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => setShowNewFolder(true)} 
                  className="btn-add-folder"
                  title="Crear nueva carpeta"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              {showNewFolder && (
                <div className="new-folder-form">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nombre de la carpeta..."
                    className="folder-name-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createFolder()
                      if (e.key === 'Escape') setShowNewFolder(false)
                    }}
                    autoFocus
                  />
                  
                  <div className="folder-color-picker">
                    {folderColors.map(color => (
                      <button
                        key={color}
                        className={`color-btn ${newFolderColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewFolderColor(color)}
                      />
                    ))}
                  </div>
                  
                  <div className="folder-form-actions">
                    <button onClick={createFolder} className="btn btn-create">
                      Crear
                    </button>
                    <button 
                      onClick={() => setShowNewFolder(false)} 
                      className="btn btn-cancel-folder"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="editor-section">
              <h3 className="section-title">
                {getPriorityIcon(priority)}
                Prioridad
              </h3>
              <div className="priority-options enhanced">
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
              
              <div className="add-category enhanced">
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
                  className="category-input enhanced"
                />
                <button onClick={addCategory} className="add-category-btn enhanced">
                  <Plus size={12} />
                </button>
              </div>

              <div className="categories-list enhanced">
                {categories.map((category, index) => (
                  <div key={index} className="category-item enhanced">
                    <span className="category-name">{category}</span>
                    <button
                      onClick={() => removeCategory(category)}
                      className="remove-category-btn"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <h3 className="section-title">Información</h3>
              <div className="note-info enhanced">
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
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Modificada:</span>
                  <span className="info-value">
                    {formatDateTime(note.updatedAt)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Caracteres:</span>
                  <span className="info-value">{content.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Palabras:</span>
                  <span className="info-value">
                    {content.trim() ? content.trim().split(/\s+/).length : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-footer enhanced">
          <div className="footer-info">
            <span className="save-shortcut">
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para guardar • <kbd>Esc</kbd> para cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditor 