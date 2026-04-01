import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff, Save, X, Folder } from 'lucide-react'
import useDictation from '../hooks/useDictation'

const CHUNK_INTERVAL_MS = 5000 // cada 5s envía un chunk a transcribir

const DictationPage = ({ folders, selectedFolder, onSave, onClose }) => {
  const [title, setTitle] = useState('Nota Dictada')
  const [finalText, setFinalText] = useState('')
  const [folderId, setFolderId] = useState(selectedFolder || (folders[0]?.id || null))
  const [useFallback, setUseFallback] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [fallbackError, setFallbackError] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false) // spinner mientras transcribe chunk

  const textareaRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunkIntervalRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleDictationResult = useCallback((text) => {
    setFinalText(prev => {
      const spacing = (prev === '' || prev.endsWith(' ') || prev.endsWith('\n')) ? '' : ' '
      return prev + spacing + text
    })
  }, [])

  const {
    isListening,
    interimText,
    isSupported,
    error,
    diagnostics,
    toggleListening,
    stopListening
  } = useDictation(handleDictationResult)

  const isDev = typeof import.meta !== 'undefined' ? import.meta.env?.DEV : process.env.NODE_ENV !== 'production'
  const isNetworkError = typeof error === 'string' && error.toLowerCase().includes('error de red')
  const ua = diagnostics?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  const looksLikeBrave = /Brave/i.test(ua)
  const looksLikeChromium = /Chromium/i.test(ua) || looksLikeBrave
  const looksLikeLinux = /Linux/i.test(ua)
  const looksLikeChromeOfficial = /Chrome\//i.test(ua) && !looksLikeBrave && !/Edg\//i.test(ua)

  const transcribeUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRANSCRIBE_URL)
    ? import.meta.env.VITE_TRANSCRIBE_URL
    : '/api/transcribe'

  // ── Envía los chunks acumulados al backend y los vacía ──────────────────────
  const flushChunks = useCallback(async (mimeType) => {
    if (audioChunksRef.current.length === 0) return

    const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
    audioChunksRef.current = []

    if (blob.size < 1000) return // demasiado corto, probablemente silencio

    setIsTranscribing(true)
    try {
      const form = new FormData()
      form.append('file', blob, 'chunk.webm')
      const res = await fetch(transcribeUrl, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.text?.trim()) {
        handleDictationResult(data.text.trim())
      }
    } catch (e) {
      setFallbackError(`Error transcribiendo chunk: ${e.message}`)
    } finally {
      setIsTranscribing(false)
    }
  }, [transcribeUrl, handleDictationResult])

  // ── Detiene grabación y limpia todo ────────────────────────────────────────
  const stopFallbackRecording = useCallback(() => {
    // Limpia el intervalo de chunks
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current)
      chunkIntervalRef.current = null
    }
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch (e) {
      // ignore
    }
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    } catch (e) {
      // ignore
    }
    setIsRecording(false)
  }, [])

  // ── Inicia grabación con chunks automáticos cada CHUNK_INTERVAL_MS ─────────
  const startFallbackRecording = useCallback(async () => {
    setFallbackError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setFallbackError('Tu navegador no soporta grabación de audio (MediaDevices/getUserMedia).')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      // Acumula los datos de audio
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data)
      }

      recorder.onerror = () => {
        setFallbackError('Error grabando audio. Revisa permisos del micrófono.')
        stopFallbackRecording()
      }

      // Cuando el recorder se detiene por el intervalo, transcribe y reinicia
      recorder.onstop = async () => {
        const mime = recorder.mimeType
        await flushChunks(mime)

        // Si todavía está "grabando" (no fue un stop manual), reinicia el recorder
        if (isRecording || mediaRecorderRef.current === recorder) {
          if (streamRef.current && streamRef.current.active) {
            const newRecorder = new MediaRecorder(streamRef.current)
            mediaRecorderRef.current = newRecorder
            newRecorder.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data)
            }
            newRecorder.onerror = recorder.onerror
            newRecorder.onstop = recorder.onstop
            newRecorder.start()
          }
        }
      }

      recorder.start()
      setIsRecording(true)

      // Cada CHUNK_INTERVAL_MS para el recorder (dispara onstop → flush → reinicia)
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, CHUNK_INTERVAL_MS)

    } catch (e) {
      setFallbackError('No se pudo acceder al micrófono. Revisa permisos del sitio/navegador.')
      setIsRecording(false)
    }
  }, [flushChunks, stopFallbackRecording])

  const handleToggleDictation = () => {
    if (useFallback) return
    toggleListening()
    if (!isListening) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const len = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(len, len)
        }
      }, 0)
    }
  }

  const showGhostInterim = Boolean(isListening && interimText)

  const handleSave = () => {
    if (isListening) stopListening()
    if (isRecording) stopFallbackRecording()
    onSave({
      title: title.trim() || 'Nota sin título',
      content: finalText.trim(),
      folderId,
      isTask: false,
      priority: 'medium',
      categories: [],
    })
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, finalText, folderId, onSave, onClose])

  useEffect(() => {
    return () => stopFallbackRecording()
  }, [stopFallbackRecording])

  if (!isSupported) {
    return (
      <div className="dictation-page error">
        <h2>Dictado de voz no soportado</h2>
        <p>Tu navegador no soporta la funcionalidad de dictado de voz nativo. Por favor usa Google Chrome modernizado.</p>
        <button className="btn btn-secondary" onClick={onClose}>Volver</button>
      </div>
    )
  }

  return (
    <div className="dictation-page" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: 'var(--bg-secondary)', padding: '40px',
      borderRadius: '16px', border: '1px solid var(--border-color)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* ── Header ── */}
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
                border: 'none', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
              }}
            />
            <span style={{ color: isListening ? '#ff453a' : isRecording ? '#ff9f0a' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
              {isListening
                ? 'Grabando activo... puedes hablar'
                : isRecording
                  ? isTranscribing
                    ? '⏳ Transcribiendo...'
                    : '🎙 Grabando (chunks de 5s)...'
                  : 'Micrófono apagado'}
            </span>
            {error && (
              <span style={{ color: '#ff453a', fontSize: '0.85rem', fontWeight: '500', marginTop: '4px', maxWidth: '520px', lineHeight: '1.4' }}>
                {error}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem' }}>
            <Save size={18} /> Guardar Nota
          </button>
          <button onClick={() => { stopListening(); onClose() }} className="btn btn-secondary" style={{ padding: '10px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Folder selector ── */}
      <div className="dictation-controls" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="folder-selection" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-primary)', padding: '8px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Folder size={16} color="var(--text-secondary)" />
          <select
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            <option value="">Sin carpeta</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Banner error de red (Web Speech) ── */}
      {isNetworkError && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Cómo solucionarlo</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            El dictado nativo (Web Speech API) está fallando con <code>network</code>.
            {looksLikeLinux && looksLikeChromium && !looksLikeChromeOfficial
              ? <> En algunas builds Chromium en Linux (incl. Brave/Chromium), puede fallar aunque exista <code>webkitSpeechRecognition</code>.</>
              : null}
            {' '}Como alternativa, usa el modo fallback (grabación + transcripción por servidor).
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => { stopListening(); setUseFallback(true) }} style={{ padding: '8px 12px', fontSize: '0.95rem' }}>
              Activar fallback
            </button>
            <button className="btn btn-secondary" onClick={() => { setUseFallback(false); setFallbackError(null) }} style={{ padding: '8px 12px', fontSize: '0.95rem' }}>
              Usar dictado nativo
            </button>
          </div>
        </div>
      )}

      {/* ── Panel fallback (chunks realtime) ── */}
      {useFallback && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Modo fallback — transcripción cada 5s
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.45 }}>
            Graba en chunks de <strong>5 segundos</strong> y transcribe automáticamente. El texto aparece progresivamente mientras hablas.
          </div>

          {fallbackError && (
            <div style={{ marginTop: 8, color: '#ff453a', fontSize: '0.9rem', fontWeight: 600 }}>
              {fallbackError}
            </div>
          )}

          {isTranscribing && (
            <div style={{ marginTop: 8, color: '#ff9f0a', fontSize: '0.9rem', fontWeight: 600 }}>
              ⏳ Transcribiendo chunk...
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {!isRecording ? (
              <button className="btn btn-primary" onClick={startFallbackRecording} style={{ padding: '8px 12px', fontSize: '0.95rem' }}>
                🎙 Empezar a grabar
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={stopFallbackRecording} style={{ padding: '8px 12px', fontSize: '0.95rem' }}>
                ⏹ Detener grabación
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Diagnóstico (solo dev) ── */}
      {isDev && diagnostics && (
        <details style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Diagnóstico (dev)</summary>
          <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </details>
      )}

      {/* ── Textarea principal ── */}
      <div className="dictation-body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {showGhostInterim && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 30, right: 30, bottom: 18,
              pointerEvents: 'none', color: 'var(--text-secondary)', opacity: 0.8,
              fontSize: '1.05rem', lineHeight: '1.4', fontStyle: 'italic',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', zIndex: 2,
              textShadow: '0 1px 0 rgba(0,0,0,0.2)'
            }}
          >
            {interimText}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={finalText}
          onChange={(e) => setFinalText(e.target.value)}
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
  )
}

export default DictationPage