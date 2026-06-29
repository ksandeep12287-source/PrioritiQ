import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatWithAI } from '../services/aiService'; // 👈 Ye import add kar
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateTask = () => {
  const [messages, setMessages] = useState([
    { text: 'Hi! Kya task create karna hai?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  
  const navigate = useNavigate();

  // 👇 Chat wala function - SessionID yaad rakhega
  const handleSendMessage = async () => {
    if (!input.trim()) {
      toast.error('Kuch likho pehle!');
      return;
    }

    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await chatWithAI(input); // 👈 aiService se call
      console.log('AI Response:', res);
      
      setMessages(prev => [...prev, { text: res.reply, sender: 'bot' }]);
      
      if (res.task) {
        setTaskCreated(true);
        toast.success('Task created! Dashboard pe ja rahe...', { 
          autoClose: 2000,
          onClose: () => navigate('/')
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('AI se baat nahi ho payi');
      setMessages(prev => [...prev, { text: 'Sorry, error aa gaya', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const styles = {
    container: { 
      maxWidth: '650px', 
      margin: '40px auto', 
      padding: '24px', 
      fontFamily: 'system-ui, sans-serif',
      background: '#fff'
    },
    h1: { 
      fontSize: '32px', 
      fontWeight: '700', 
      marginBottom: '24px',
      color: '#1f2937'
    },
    chatBox: {
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      height: '400px',
      overflowY: 'auto',
      padding: '16px',
      marginBottom: '16px',
      background: '#f9fafb'
    },
    msgUser: {
      background: '#2563eb',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '12px 12px 0 12px',
      marginLeft: 'auto',
      marginBottom: '8px',
      maxWidth: '70%',
      wordWrap: 'break-word'
    },
    msgBot: {
      background: '#e5e7eb',
      color: '#1f2937',
      padding: '10px 14px',
      borderRadius: '12px 12px 12px 0',
      marginRight: 'auto',
      marginBottom: '8px',
      maxWidth: '70%',
      wordWrap: 'break-word'
    },
    inputRow: {
      display: 'flex',
      gap: '8px'
    },
    input: { 
      flex: 1,
      padding: '12px', 
      border: '1px solid #d1d5db', 
      borderRadius: '8px', 
      fontSize: '14px',
      outline: 'none'
    },
    button: { 
      padding: '12px 24px', 
      background: '#2563eb', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      fontSize: '14px', 
      fontWeight: '600', 
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 style={styles.h1}>AI Task Creator</h1>

      {/* Chat Box */}
      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.sender === 'user' ? styles.msgUser : styles.msgBot}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div style={styles.msgBot}>Typing...</div>}
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Example: Kal 5 baje assignment submit karna hai"
          style={styles.input}
          disabled={isLoading || taskCreated}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || taskCreated}
          style={{...styles.button, background: isLoading ? '#9ca3af' : '#2563eb'}}
        >
          {isLoading ? 'Wait...' : 'Send'}
        </button>
      </div>

      {taskCreated && (
        <p style={{marginTop: '16px', color: '#10b981', fontWeight: '600'}}>
          ✅ Task create ho gaya! Dashboard pe redirect ho raha...
        </p>
      )}
    </div>
  );
};

export default CreateTask;