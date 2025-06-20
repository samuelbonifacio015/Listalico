import { useState } from 'react'
import { Folder, Edit3, Trash2, Check, X, Palette } from 'lucide-react'

const Sidebar = ({ folders, setFolders, selectedFolder, setSelectedFolder, notes }) => {
  const [editingFolder, setEditingFolder] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(null)
  const [customColor, setCustomColor] = useState('')

  const presetColors = [
    '#007aff', '#34c759', '#ff9500', '#ff453a', 
    '#af52de', '#5ac8fa', '#ffcc02', '#ff2d92'
  ]

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

  const deleteFolder = (folderId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta carpeta? Las notas dentro de ella también se eliminarán.')) {
      setFolders(prev => prev.filter(folder => folder.id !== folderId))
      if (selectedFolder === folderId) {
        setSelectedFolder(null)
      }
    }
  }

  const changeColor = (folderId, color) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, color }
        : folder
    ))
    setShowColorPicker(null)
    setCustomColor('')
  }

  const applyCustomColor = (folderId) => {
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      changeColor(folderId, customColor)
    }
  }

  const getNotesCount = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length
  }

  const getTotalNotes = () => {
    return notes.length
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
                <div className="folder-icon" style={{ backgroundColor: folder.color }}>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowColorPicker(showColorPicker === folder.id ? null : folder.id)
                    }}
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
                      deleteFolder(folder.id)
                    }}
                    className="action-btn delete"
                    title="Eliminar carpeta"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker */}
            {showColorPicker === folder.id && (
              <div className="color-picker">
                <div className="preset-colors">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className="color-button"
                      style={{ backgroundColor: color }}
                      onClick={() => changeColor(folder.id, color)}
                      title={color}
                    />
                  ))}
                </div>
                
                <div className="custom-color">
                  <input
                    type="text"
                    placeholder="#000000"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyCustomColor(folder.id)
                    }}
                    className="custom-color-input"
                  />
                  <button
                    onClick={() => applyCustomColor(folder.id)}
                    className="apply-color-btn"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar 