const axios = require('axios');

const generateSpeech = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const apiKey = process.env.VOICERSS_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'VoiceRSS API key not configured' });
    }

    const url = `https://api.voicerss.org/?key=${apiKey}&hl=en-in&v=Aditi&r=0&c=MP3&f=44khz_16bit_stereo&src=${encodeURIComponent(text)}`;

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);

  } catch (error) {
    console.error('TTS Error:', error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

module.exports = { generateSpeech };