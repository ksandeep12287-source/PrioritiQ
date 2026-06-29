import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setListening(false);
    };
    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!isSupported) return alert('Use Chrome/Edge');
    setTranscript('');
    setListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setListening(false);
    recognitionRef.current?.stop();
  };

  const resetTranscript = () => setTranscript('');

  return { transcript, listening, isSupported, startListening, stopListening, resetTranscript };
};

export default useSpeechRecognition;