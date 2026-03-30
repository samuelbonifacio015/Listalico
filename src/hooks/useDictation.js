import { useState, useEffect, useRef, useCallback } from 'react';

const useDictation = (onFinalResult) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const isIntentionallyStopped = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'es-ES'; // Default to Spanish

    recognitionRef.current.onresult = (event) => {
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
      
      if (final) {
        onFinalResult(final);
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if it was stopped by the system but we still want to listen
      if (!isIntentionallyStopped.current) {
        try {
          recognitionRef.current.start();
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

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (['not-allowed', 'audio-capture', 'service-not-allowed', 'network', 'aborted'].includes(event.error)) {
        isIntentionallyStopped.current = true;
        setIsListening(false);
        setInterimText('');
      }
      // For other transient errors like 'no-speech', it will trigger onend to attempt restart
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onFinalResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      isIntentionallyStopped.current = false;
      recognitionRef.current.start();
      setIsListening(true);
      setInterimText('');
    } catch (e) {
      console.error('Failed to start recognition', e);
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

  return { isListening, interimText, isSupported, toggleListening, stopListening };
};

export default useDictation;
