import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Settings, LogOut, Edit3, Save, X, Key, AlertCircle, CheckCircle } from 'lucide-react'

const UserProfile = ({ onClose }) => {
  const { user, signOut, updateProfile, updatePassword } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await updateProfile({
        full_name: formData.fullName
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Perfil actualizado correctamente')
        setIsEditing(false)
      }
    } catch (err) {
      setError('Error al actualizar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await updatePassword(passwordData.newPassword)

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Contraseña actualizada correctamente')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setIsChangingPassword(false)
      }
    } catch (err) {
      setError('Error al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      onClose?.()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const cancelEdit = () => {
    setFormData({
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || ''
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const cancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setIsChangingPassword(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="user-profile-overlay">
      <div className="user-profile-modal">
        <div className="user-profile-header">
          <div className="profile-title">
            <User size={24} />
            <h3>Perfil de Usuario</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="user-profile-content">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="profile-section">
            <div className="profile-info">
              <div className="info-item">
                <Mail size={16} />
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              
              <div className="info-item">
                <User size={16} />
                <span className="info-label">Nombre:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="Nombre completo"
                  />
                ) : (
                  <span className="info-value">
                    {user?.user_metadata?.full_name || 'No especificado'}
                  </span>
                )}
              </div>
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    <Save size={16} />
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="btn btn-secondary"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                >
                  <Edit3 size={16} />
                  Editar perfil
                </button>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h4>Seguridad</h4>
            {isChangingPassword ? (
              <div className="password-change">
                <div className="form-group">
                  <label>Nueva contraseña:</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Nueva contraseña"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar contraseña:</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirmar nueva contraseña"
                  />
                </div>
                <div className="password-actions">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    <Key size={16} />
                    {isLoading ? 'Cambiando...' : 'Cambiar contraseña'}
                  </button>
                  <button
                    onClick={cancelPasswordChange}
                    className="btn btn-secondary"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="btn btn-secondary"
              >
                <Key size={16} />
                Cambiar contraseña
              </button>
            )}
          </div>

          <div className="profile-section">
            <button
              onClick={handleSignOut}
              className="btn btn-danger sign-out-btn"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

