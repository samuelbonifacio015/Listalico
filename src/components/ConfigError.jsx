import React from 'react'

const ConfigError = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#ff4444',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '14px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⚠️ Configuración de Supabase requerida</h4>
      <p style={{ margin: '0 0 10px 0' }}>
        Para que las tareas se guarden en el servidor, necesitas configurar Supabase:
      </p>
      <ol style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
        <li>Crea un archivo <code>.env.local</code> en la raíz del proyecto</li>
        <li>Agrega tus credenciales de Supabase:</li>
      </ol>
      <pre style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        margin: '0',
        overflow: 'auto'
      }}>
{`VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima`}
      </pre>
      <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
        Las tareas se guardarán localmente hasta que configures Supabase.
      </p>
    </div>
  )
}

export default ConfigError
