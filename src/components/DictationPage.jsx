import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff, Save, X, Folder } from 'lucide-react'
import useDictation from '../hooks/useDictation'

const DictationPage = ({ folders, selectedFolder, onSave, onClose }) => {
  const [title, setTitle] = useState('Nota Dictada')
  const [content, setContent] = useState('')
  const [folderId, setFolderId] = useState(selectedFolder || (folders[0]?.id || null))
  const textareaRef = useRef(null)

  const handleDictationResult = useCallback((text) => {
    setContent(prev => {
      const spacing = (prev === '' || prev.endsWith(' ') || prev.endsWith('\n')) ? '' : ' ';
      return prev + spacing + text;
    });
  }, []);

  const { 
    isListening, 
    interimText, 
    isSupported, 
    error,
    toggleListening, 
    stopListening 
  } = useDictation(handleDictationResult);

  const handleToggleDictation = () => {
    toggleListening();
    if (!isListening) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 0);
    }
  };

  const displayContent = isListening && interimText 
    ? content + (content && !content.endsWith(' ') && !content.endsWith('\n') ? ' ' : '') + interimText
    : content;

  const handleSave = () => {
    if (isListening) {
      stopListening();
    }
    onSave({
      title: title.trim() || 'Nota sin título',
      content: content.trim(),
      folderId,
      isTask: false,
      priority: 'medium',
      categories: [],
      // We are letting the parent app add id, createdAt, etc.
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title, content, folderId, onSave, onClose]);

  if (!isSupported) {
    return (
      <div className="dictation-page error">
        <h2>Dictado de voz no soportado</h2>
        <p>Tu navegador no soporta la funcionalidad de dictado de voz nativo. Por favor usa Google Chrome modernizado.</p>
        <button className="btn btn-secondary" onClick={onClose}>Volver</button>
      </div>
    );
  }

  return (
    <div className="dictation-page" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', 
      backgroundColor: 'var(--bg-secondary)', padding: '40px',
      borderRadius: '16px', border: '1px solid var(--border-color)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="dictation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <button 
             onClick={handleToggleDictation}
             className={`dictation-power-btn ${isListening ? 'listening' : ''}`}
             style={{
               width: '60px', height: '60px', borderRadius: '50%',
               display: 'flex', justifyContent: 'center', alignItems: 'center',
               backgroundColor: isListening ? 'rgba(255, 69, 58, 0.2)' : 'var(--bg-primary)',
               color: isListening ? '#ff453a' : 'var(--text-secondary)',
               border: `2px solid ${isListening ? '#ff453a' : 'var(--border-color)'}`,
               cursor: 'pointer', transition: 'all 0.3s ease',
               boxShadow: isListening ? '0 0 20px rgba(255, 69, 58, 0.4)' : 'none'
             }}
           >
             {isListening ? <Mic size={28} style={{ animation: 'pulse 1.5s infinite' }} /> : <MicOff size={28} />}
           </button>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
             <input 
               type="text" 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Título del dictado..."
               style={{
                 fontSize: '1.8rem', fontWeight: 'bold', background: 'transparent',
                 border: 'none', color: 'var(--text-primary)', outline: 'none',
                 fontFamily: 'inherit'
               }}
             />
             <span style={{ color: isListening ? '#ff453a' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
               {isListening ? 'Grabando activo... puedes hablar' : 'Micrófono apagado'}
             </span>
             {error && (
               <span style={{ color: '#ff453a', fontSize: '0.85rem', fontWeight: '500', marginTop: '4px', maxWidth: '500px', lineHeight: '1.4' }}>
                 ⚠️ {error}
               </span>
             )}
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem' }}>
            <Save size={18} /> Guardar Nota
          </button>
          <button onClick={() => { stopListening(); onClose(); }} className="btn btn-secondary" style={{ padding: '10px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="dictation-controls" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
         <div className="folder-selection" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-primary)', padding: '8px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
           <Folder size={16} color="var(--text-secondary)" />
           <select 
             value={folderId || ''} 
             onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
             style={{ 
               background: 'transparent', border: 'none', color: 'var(--text-primary)', 
               outline: 'none', fontSize: '0.9rem', cursor: 'pointer' 
             }}
           >
             <option value="">Sin carpeta</option>
             {folders.map(f => (
               <option key={f.id} value={f.id}>{f.name}</option>
             ))}
           </select>
         </div>
      </div>

      <div className="dictation-body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={(e) => {
            if (isListening) stopListening();
            setContent(e.target.value);
          }}
          placeholder="Presiona el micrófono y comienza a hablar. El texto aparecerá aquí mágicamente..."
          style={{
             flex: 1, width: '100%', resize: 'none', padding: '30px',
             fontSize: '1.2rem', lineHeight: '1.6', backgroundColor: 'var(--bg-primary)',
             color: 'var(--text-primary)', border: '1px solid var(--border-color)',
             borderRadius: '12px', outline: 'none', transition: 'border-color 0.3s',
             boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default DictationPage;
