import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
axios.defaults.baseURL = API_BASE;

// 👇 YE LINE SABSE UPAR ADD KAR - Refresh tak same rahega
const SESSION_ID = 'user_' + Date.now();

export const analyzeVoice = async (text) => {
  try {
    const response = await axios.post('/api/v1/ai/analyze', { text });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'AI analysis failed';
    throw new Error(msg);
  }
};

// 👇 YE NAYA FUNCTION ADD KAR - CHAT KE LIYE
export const chatWithAI = async (message) => {
  try {
    const response = await axios.post('/api/v1/ai/chat', { 
      message: message,
      sessionId: SESSION_ID  // ← YE ZAROORI HAI
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.reply || 'Chat failed';
    throw new Error(msg);
  }
};