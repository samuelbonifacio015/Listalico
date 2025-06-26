import { useState, useRef, useEffect } from 'react'
import { Folder, Edit3, Trash2, Palette, RotateCcw, X, FolderPlus, ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react'

const Sidebar = ({ 
  folders = [], 
  setFolders = () => {}, 
  deletedFolders = [],
  deletedNotes = [],
  selectedFolder, 
  setSelectedFolder = () => {}, 
  notes = [],
  showTrash = false,
  setShowTrash = () => {},
  moveToTrash = () => {},
  restoreFromTrash = () => {},
  restoreNoteFromTrash = () => {},
  permanentlyDelete = () => {},
  permanentlyDeleteNote = () => {},
  createNewFolder = () => {},
  createNewNote = () => {},
  expandedFolders = new Set(),
  toggleFolderExpansion = () => {},
  onNoteSelect = () => {},
  selectedNote = null
}) => {
  const [editingFolder, setEditingFolder] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(null)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const [selectedColor, setSelectedColor] = useState('#666666')
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [lightness, setLightness] = useState(40)
  const [dragOverFolder, setDragOverFolder] = useState(null)
  
  const colorPickerRef = useRef(null)

  const presetColors = [
    '#666666', '#007aff', '#34c759', '#ff9500', '#ff453a', 
    '#af52de', '#5ac8fa', '#ffcc02', '#ff2d92', '#8e8e93'
  ]

  // Convertir HSL a HEX
  const hslToHex = (h, s, l) => {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = n => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Convertir HEX a HSL
  const hexToHsl = (hex) => {
    if (!hex || typeof hex !== 'string' || hex.length !== 7) {
      return [0, 0, 40]
    }
    
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
        default: h = 0
      }
      h /= 6
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }

  const startEditing = (folder) => {
    setEditingFolder(folder.id)
    setEditingName(folder.name)
  }

  const saveEdit = () => {
    if (editingName.trim()) {
      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder 
          ? { ...folder, name: editingName.trim() }
          : folder
      ))
    }
    setEditingFolder(null)
    setEditingName('')
  }

  const cancelEdit = () => {
    setEditingFolder(null)
    setEditingName('')
  }

  const deleteFolder = (folder) => {
    if (moveToTrash) {
      moveToTrash(folder)
    }
  }

  const openColorPicker = (folder, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const pickerWidth = 300 // Ancho estimado del color picker
    const pickerHeight = 400 // Altura estimada del color picker
    
    // Calcular posición X (horizontal)
    let x = rect.right + 10 // Intentar mostrar a la derecha del botón
    if (x + pickerWidth > viewportWidth) {
      x = rect.left - pickerWidth - 10 // Si no cabe, mostrar a la izquierda
    }
    if (x < 10) {
      x = 10 // Si tampoco cabe a la izquierda, alinear al borde
    }
    
    // Calcular posición Y (vertical)
    let y = rect.top + window.scrollY
    if (rect.top + pickerHeight > viewportHeight) {
      y = rect.bottom + window.scrollY - pickerHeight // Si no cabe abajo, mostrar arriba
    }
    if (y < window.scrollY + 10) {
      y = window.scrollY + 10 // Si tampoco cabe arriba, alinear al borde superior visible
    }
    
    setPickerPosition({ x, y })
    
    const [h, s, l] = hexToHsl(folder.color)
    setHue(h)
    setSaturation(s)
    setLightness(l)
    setSelectedColor(folder.color)
    setShowColorPicker(showColorPicker === folder.id ? null : folder.id)
  }

  const changeColor = (folderId, color) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, color }
        : folder
    ))
    setSelectedColor(color)
  }

  const applyColor = (folderId) => {
    const newColor = hslToHex(hue, saturation, lightness)
    changeColor(folderId, newColor)
    setShowColorPicker(null)
  }

  const getNotesCount = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length
  }

  const getTotalNotes = () => {
    return notes.length
  }

  const getFolderNotes = (folderId) => {
    return notes.filter(note => note.folderId === folderId)
  }

  const getFolderName = (folderId) => {
    if (!folderId) return 'Sin carpeta'
    const folder = folders.find(f => f.id === folderId)
    return folder?.name || 'Carpeta eliminada'
  }

  // Funciones de drag and drop
  const handleDragOver = (e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)
  }

  const handleDragLeave = (e) => {
    // Solo remover el efecto si realmente salimos del elemento
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null)
    }
  }

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault()
    setDragOverFolder(null)
    
    const noteId = parseInt(e.dataTransfer.getData('text/plain'))
    if (noteId && moveNoteToFolder) {
      moveNoteToFolder(noteId, targetFolderId)
    }
  }

  const handleFolderClick = (folderId) => {
    setSelectedFolder(folderId)
    toggleFolderExpansion(folderId)
  }

  // Cerrar color picker al hacer clic fuera y manejar scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(null)
      }
    }

    const handleScroll = () => {
      if (showColorPicker) {
        setShowColorPicker(null) // Cerrar el color picker al hacer scroll
      }
    }

    const handleResize = () => {
      if (showColorPicker) {
        setShowColorPicker(null) // Cerrar el color picker al redimensionar
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [showColorPicker])

  // Actualizar el color seleccionado cuando cambian HSL
  useEffect(() => {
    setSelectedColor(hslToHex(hue, saturation, lightness))
  }, [hue, saturation, lightness])

  const handleHueChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newHue = Math.max(0, Math.min(360, (x / rect.width) * 360))
    setHue(newHue)
  }

  const handleSaturationLightnessChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newSaturation = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newLightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
    setSaturation(newSaturation)
    setLightness(newLightness)
  }

  if (showTrash) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="header-content">
            <h2 className="sidebar-title">🗑️ Papelera</h2>
            <div className="header-actions">
              <button 
                onClick={() => setShowTrash(false)} 
                className={`header-btn ${showTrash ? 'active' : ''}`} 
                title="Carpetas"
              >
                <Folder size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="folders-list">
          {deletedFolders.length === 0 && deletedNotes.length === 0 ? (
            <div className="empty-trash">
              <div className="empty-icon">🗑️</div>
              <p>La papelera está vacía</p>
            </div>
          ) : (
            <>
              {/* Carpetas eliminadas */}
              {deletedFolders.length > 0 && (
                <div className="trash-section">
                  <h4 className="trash-section-title">Carpetas</h4>
                  {deletedFolders.map(folder => (
                    <div key={folder.id} className="folder-container">
                      <div className="folder-item deleted">
                        <div className="folder-info">
                          <div className="folder-icon" style={{ backgroundColor: folder.color || '#666666' }}>
                            <Folder size={16} />
                          </div>
                          <span className="folder-name">{folder.name}</span>
                        </div>
                        
                        <div className="folder-actions">
                          <span className="delete-date">
                            {new Date(folder.deletedAt).toLocaleDateString()}
                          </span>
                          
                          <div className="action-buttons">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (restoreFromTrash) restoreFromTrash(folder.id)
                              }}
                              className="action-btn restore"
                              title="Restaurar carpeta"
                            >
                              <RotateCcw size={12} />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (permanentlyDelete) permanentlyDelete(folder.id)
                              }}
                              className="action-btn delete permanent"
                              title="Eliminar permanentemente"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notas eliminadas */}
              {deletedNotes.length > 0 && (
                <div className="trash-section">
                  <h4 className="trash-section-title">Notas</h4>
                  {deletedNotes.map(note => (
                    <div key={note.id} className="folder-container">
                      <div className="folder-item deleted note-item">
                        <div className="folder-info">
                          <div className="folder-icon note-icon">
                            <FileText size={16} />
                          </div>
                          <div className="note-info">
                            <span className="folder-name">{note.title}</span>
                            <span className="note-folder">📁 {getFolderName(note.originalFolderId)}</span>
                          </div>
                        </div>
                        
                        <div className="folder-actions">
                          <span className="delete-date">
                            {new Date(note.deletedAt).toLocaleDateString()}
                          </span>
                          
                          <div className="action-buttons">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (restoreNoteFromTrash) restoreNoteFromTrash(note.id)
                              }}
                              className="action-btn restore"
                              title="Restaurar nota"
                            >
                              <RotateCcw size={12} />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (permanentlyDeleteNote) permanentlyDeleteNote(note.id)
                              }}
                              className="action-btn delete permanent"
                              title="Eliminar permanentemente"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-content">
          <h2 className="sidebar-title">Carpetas</h2>
          <div className="header-actions">
            <button 
              onClick={createNewFolder} 
              className="header-btn" 
              title="Nueva Carpeta"
            >
              <FolderPlus size={16} />
            </button>
            <button 
              onClick={() => setShowTrash(!showTrash)} 
              className={`header-btn ${showTrash ? 'active' : ''}`} 
              title="Papelera"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="folders-list">
        {/* Opción "Todas las notas" */}
        <div 
          className={`folder-item ${selectedFolder === null ? 'active' : ''} ${dragOverFolder === null ? 'drag-over' : ''}`}
          onClick={() => setSelectedFolder(null)}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="folder-info">
            <div className="folder-icon" style={{ backgroundColor: '#666666' }}>
              <Folder size={16} />
            </div>
            <span className="folder-name">Todas las notas</span>
          </div>
          <span className="notes-count">{getTotalNotes()}</span>
        </div>

        {/* Lista de carpetas */}
        {folders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id)
          const folderNotes = getFolderNotes(folder.id)
          
          return (
            <div key={folder.id} className="folder-container">
              <div 
                className={`folder-item ${selectedFolder === folder.id ? 'active' : ''} ${dragOverFolder === folder.id ? 'drag-over' : ''}`}
                onClick={() => handleFolderClick(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div className="folder-info">
                  <div className="folder-expand-btn">
                    {folderNotes.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFolderExpansion(folder.id)
                        }}
                        className="expand-icon"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                  </div>
                  
                  <div className="folder-icon" style={{ backgroundColor: folder.color || '#666666' }}>
                    <Folder size={16} />
                  </div>
                  
                  {editingFolder === folder.id ? (
                    <div className="edit-folder-input">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        className="folder-name-input"
                      />
                    </div>
                  ) : (
                    <span className="folder-name">{folder.name}</span>
                  )}
                </div>

                <div className="folder-actions">
                  <span className="notes-count">{getNotesCount(folder.id)}</span>
                  
                  <div className="action-buttons">
                    <button
                      onClick={(e) => openColorPicker(folder, e)}
                      className="action-btn"
                      title="Cambiar color"
                    >
                      <Palette size={12} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(folder)
                      }}
                      className="action-btn"
                      title="Editar nombre"
                    >
                      <Edit3 size={12} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFolder(folder)
                      }}
                      className="action-btn delete"
                      title="Mover a papelera"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notas expandidas */}
              {isExpanded && folderNotes.length > 0 && (
                <div className="folder-notes">
                  {folderNotes.map(note => (
                    <div 
                      key={note.id} 
                      className={`folder-note-item ${selectedNote === note.id ? 'selected' : ''}`}
                      onClick={() => onNoteSelect(note.id)}
                    >
                      <div className="note-icon">
                        <div 
                          className="folder-color-indicator"
                          style={{ backgroundColor: folder.color || '#666666' }}
                        />
                        <FileText size={12} />
                      </div>
                      <span className="note-title" title={note.title}>
                        {note.title.length > 25 ? `${note.title.substring(0, 25)}...` : note.title}
                      </span>
                      <span className="note-date">
                        {new Date(note.updatedAt).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Botón Nueva Nota */}
        <div className="new-note-section">
          <button 
            onClick={createNewNote} 
            className="btn-new-note" 
            title="Crear nueva nota"
          >
            <Plus size={16} />
            Nueva Nota
          </button>
        </div>
      </div>

      {/* Color Picker Mejorado */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="advanced-color-picker"
          style={{
            position: 'absolute',
            left: pickerPosition.x,
            top: pickerPosition.y,
            zIndex: 1000
          }}
        >
          <div className="color-picker-header">
            <h4>Seleccionar Color</h4>
            <div 
              className="color-preview" 
              style={{ backgroundColor: selectedColor }}
            />
          </div>

          {/* Colores predefinidos */}
          <div className="preset-colors">
            {presetColors.map(color => (
              <button
                key={color}
                className={`color-button ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  const [h, s, l] = hexToHsl(color)
                  setHue(h)
                  setSaturation(s)
                  setLightness(l)
                  setSelectedColor(color)
                }}
                title={color}
              />
            ))}
          </div>

          {/* Selector de saturación y luminosidad */}
          <div className="sl-picker">
            <div 
              className="sl-picker-area"
              style={{
                background: `linear-gradient(to top, #000 0%, transparent 100%), linear-gradient(to right, #fff 0%, hsl(${hue}, 100%, 50%) 100%)`
              }}
              onClick={handleSaturationLightnessChange}
            >
              <div 
                className="sl-picker-cursor"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`
                }}
              />
            </div>
          </div>

          {/* Selector de matiz */}
          <div className="hue-picker">
            <div 
              className="hue-slider"
              onClick={handleHueChange}
            >
              <div 
                className="hue-cursor"
                style={{ left: `${(hue / 360) * 100}%` }}
              />
            </div>
          </div>

          {/* Información del color */}
          <div className="color-info">
            <div className="color-values">
              <span className="color-hex">{selectedColor}</span>
              <span className="color-hsl">HSL({Math.round(hue)}, {Math.round(saturation)}%, {Math.round(lightness)}%)</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="color-picker-actions">
            <button 
              onClick={() => setShowColorPicker(null)}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button 
              onClick={() => applyColor(showColorPicker)}
              className="btn-apply"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar 