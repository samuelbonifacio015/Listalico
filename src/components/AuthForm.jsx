import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

const AuthForm = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, signUp } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos requeridos')
      return false
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden')
        return false
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return false
      }
      if (!formData.fullName.trim()) {
        setError('Por favor ingresa tu nombre completo')
        return false
      }
    }

    return true
  }

  const getErrorMessage = (error) => {
    if (!error) return ''
    
    const errorMessage = error.message || error.toString()
    
    // Mensajes específicos para errores comunes de Supabase
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos. Verifica tus credenciales.'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
    }
    if (errorMessage.includes('User already registered')) {
      return 'Este email ya está registrado. Intenta iniciar sesión en su lugar.'
    }
    if (errorMessage.includes('Password should be at least 6 characters')) {
      return 'La contraseña debe tener al menos 6 caracteres.'
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Por favor ingresa un email válido.'
    }
    if (errorMessage.includes('Signup is disabled')) {
      return 'El registro está temporalmente deshabilitado. Contacta al administrador.'
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.'
    }
    
    // Mensaje genérico si no coincide con ninguno específico
    return errorMessage
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) {
          console.error('Login error:', error) // Log para debugging
          setError(getErrorMessage(error))
        } else {
          setSuccess('¡Inicio de sesión exitoso!')
          onSuccess?.()
        }
      } else {
        const { data, error } = await signUp(
          formData.email, 
          formData.password, 
          { full_name: formData.fullName }
        )
        if (error) {
          console.error('Signup error:', error) // Log para debugging
          setError(getErrorMessage(error))
        } else {
          setSuccess('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.')
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err) // Log para debugging
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    })
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">
              <User size={32} />
            </div>
            <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          </div>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Accede a tu espacio de notas personal' 
              : 'Crea tu cuenta para comenzar a organizar tus notas'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Nombre completo
              </label>
              <div className="input-container">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tu nombre completo"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <div className="input-container">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="input-container">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar contraseña
              </label>
              <div className="input-container">
                <Lock size={16} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirma tu contraseña"
                  required={!isLogin}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

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

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={toggleMode}
              className="auth-toggle-btn"
            >
              {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
