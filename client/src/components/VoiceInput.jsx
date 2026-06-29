import { useState } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { analyzeVoice } from '../services/aiService';
import { Mic, Square, Loader2 } from 'lucide-react';

const VoiceInput = ({ onTaskParsed }) => {
  const { transcript, listening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return alert('Speak something first');
    setIsAnalyzing(true);
    try {
      const result = await analyzeVoice(transcript);
      onTaskParsed(result);
      resetTranscript();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isSupported) return <p>Voice not supported. Use Chrome.</p>;

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mb-6">
      <div className="flex gap-3">
        {!listening? (
          <button onClick={startListening} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
            <Mic size={18} /> Start Listening
          </button>
        ) : (
          <button onClick={stopListening} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg animate-pulse">
            <Square size={18} /> Stop
          </button>
        )}
        <button onClick={handleAnalyze} disabled={!transcript || isAnalyzing || listening} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400">
          {isAnalyzing? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : 'Analyze'}
        </button>
      </div>
      <div className="p-3 bg-white border rounded-lg">
        <p className="text-sm text-gray-500">Transcript:</p>
        <p>{transcript || (listening? 'Listening...' : 'Click Start Listening')}</p>
      </div>
    </div>
  );
};

export default VoiceInput;