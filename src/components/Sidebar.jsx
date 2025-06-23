import { useState, useRef, useEffect } from 'react'
import { Folder, Edit3, Trash2, Palette, RotateCcw, X } from 'lucide-react'

const Sidebar = ({ 
  folders = [], 
  setFolders = () => {}, 
  deletedFolders = [],
  selectedFolder, 
  setSelectedFolder = () => {}, 
  notes = [],
  showTrash = false,
  moveToTrash = () => {},
  restoreFromTrash = () => {},
  permanentlyDelete = () => {}
}) => {
  const [editingFolder, setEditingFolder] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(null)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const [selectedColor, setSelectedColor] = useState('#666666')
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [lightness, setLightness] = useState(40)
  
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
    setPickerPosition({ 
      x: Math.max(10, rect.left - 280), 
      y: rect.top 
    })
    
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

  // Cerrar color picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(null)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
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
          <h2 className="sidebar-title">🗑️ Papelera</h2>
        </div>

        <div className="folders-list">
          {deletedFolders.length === 0 ? (
            <div className="empty-trash">
              <div className="empty-icon">🗑️</div>
              <p>La papelera está vacía</p>
            </div>
          ) : (
            deletedFolders.map(folder => (
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
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Carpetas</h2>
      </div>

      <div className="folders-list">
        {/* Opción "Todas las notas" */}
        <div 
          className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
          onClick={() => setSelectedFolder(null)}
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
        {folders.map(folder => (
          <div key={folder.id} className="folder-container">
            <div 
              className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="folder-info">
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
          </div>
        ))}
      </div>

      {/* Color Picker Mejorado */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="advanced-color-picker"
          style={{
            position: 'fixed',
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