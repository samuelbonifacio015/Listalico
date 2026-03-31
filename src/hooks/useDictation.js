import { useState, useEffect, useRef, useCallback } from 'react';

const useDictation = (onFinalResult) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
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

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

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
      
      let errorMessage = 'Error en el reconocimiento de voz.';
      if (event.error === 'network') {
        errorMessage = 'Error de red (Network). Chromium Linux requiere credenciales de Google API en su compilación. Por favor, asegúrate de usar Google Chrome oficial o revisar tu conexión a internet.';
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

  return { isListening, interimText, isSupported, error, toggleListening, stopListening };
};

export default useDictation;
