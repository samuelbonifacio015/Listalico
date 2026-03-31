import { useState, useEffect, useRef, useCallback } from 'react';

const useDictation = (onFinalResult) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const recognitionRef = useRef(null);
  const isIntentionallyStopped = useRef(true);

  // Store the latest callback to prevent useEffect from re-running
  const finalResultCallbackRef = useRef(onFinalResult);
  useEffect(() => {
    finalResultCallbackRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const isDev = typeof import.meta !== 'undefined' ? import.meta.env?.DEV : process.env.NODE_ENV !== 'production';
    const setDiag = (patch) => {
      if (!isDev) return;
      setDiagnostics((prev) => ({
        ...(prev || {}),
        ...patch,
        updatedAt: Date.now(),
      }));
    };

    setDiag({
      isDev,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      origin: window.location?.origin,
      speechRecognitionImpl: window.SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition',
    });

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((status) => {
          setDiag({ microphonePermission: status.state });
          status.onchange = () => setDiag({ microphonePermission: status.state });
        })
        .catch(() => {
          setDiag({ microphonePermission: 'unknown' });
        });
    } else {
      setDiag({ microphonePermission: 'unsupported' });
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES'; // Default to Spanish
    } catch (e) {
      setIsSupported(false);
      return;
    }

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setDiag({ lastEvent: 'onstart' });
    };

    recognition.onaudiostart = () => {
      setDiag({ lastEvent: 'onaudiostart' });
    };

    recognition.onsoundstart = () => {
      setDiag({ lastEvent: 'onsoundstart' });
    };

    recognition.onspeechstart = () => {
      setDiag({ lastEvent: 'onspeechstart' });
    };

    recognition.onspeechend = () => {
      setDiag({ lastEvent: 'onspeechend' });
    };

    recognition.onnomatch = () => {
      setDiag({ lastEvent: 'onnomatch' });
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      setDiag({
        lastEvent: 'onresult',
        lastResultIndex: event.resultIndex,
        lastResultsLength: event.results?.length,
      });

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);
      
      if (final && finalResultCallbackRef.current) {
        finalResultCallbackRef.current(final);
      }
    };

    recognition.onend = () => {
      setDiag({ lastEvent: 'onend' });
      // Auto-restart if it was stopped by the system but we still want to listen
      if (!isIntentionallyStopped.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting speech recognition:', e);
          setIsListening(false);
          setInterimText('');
        }
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setDiag({
        lastEvent: 'onerror',
        lastError: event.error,
        lastErrorTime: Date.now(),
      });
      
      let errorMessage = 'Error en el reconocimiento de voz.';
      if (event.error === 'network') {
        const ua = navigator.userAgent || '';
        const isLinux = /Linux/i.test(ua);
        const isBrave = /Brave/i.test(ua);
        const isChromiumLike = /Chromium/i.test(ua) || isBrave;
        const isChrome = /Chrome\//i.test(ua) && !isBrave && !/Edg\//i.test(ua);

        if (isLinux && isChromiumLike && !isChrome) {
          errorMessage =
            'Error de red (network) en el motor de dictado. En algunas compilaciones Chromium en Linux (incl. Brave/Chromium), el dictado nativo puede fallar por el servicio de reconocimiento. Prueba con Google Chrome oficial o usa el modo fallback (grabación + transcripción por servidor).';
        } else {
          errorMessage =
            'Error de red (network) en el motor de dictado. Revisa conexión/VPN/proxy/firewall y permisos del micrófono. Si persiste, usa el modo fallback (grabación + transcripción por servidor).';
        }
      } else if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        errorMessage = 'Permiso denegado para usar el micrófono.';
      } else if (event.error === 'aborted') {
        errorMessage = 'Grabación abortada.';
      }
      
      if (['not-allowed', 'audio-capture', 'service-not-allowed', 'network', 'aborted', 'no-speech'].includes(event.error)) {
        if (event.error !== 'no-speech') {
          setError(errorMessage);
        }
        isIntentionallyStopped.current = true;
        setIsListening(false);
        setInterimText('');
      }
    };

    return () => {
      if (recognition) {
        // Remove listeners to prevent state updates on unmounted component
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.onstart = null;
        recognition.onaudiostart = null;
        recognition.onsoundstart = null;
        recognition.onspeechstart = null;
        recognition.onspeechend = null;
        recognition.onnomatch = null;
        recognition.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setError(null);
      isIntentionallyStopped.current = false;
      recognitionRef.current.start();
      setIsListening(true);
      setInterimText('');
    } catch (e) {
      console.error('Failed to start recognition', e);
      setError('No se pudo iniciar el micrófono. Asegúrate de tener permisos habilitados.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      isIntentionallyStopped.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } catch (e) {
      console.error('Failed to stop recognition', e);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, interimText, isSupported, error, diagnostics, toggleListening, stopListening };
};

export default useDictation;
