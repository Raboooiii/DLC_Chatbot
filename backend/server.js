const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://dlcfunbot.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// OpenRouter API call function
async function callOpenRouterAPI(payload) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dlcfunbot.netlify.app',
        'X-Title': 'DLC FunBot'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

// Chat endpoint
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const payload = {
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
      max_tokens: 1000
    };

    const data = await callOpenRouterAPI(payload);
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      reply: "I'm having trouble connecting to my knowledge base. Please try again later!"
    });
  }
});

// Image analysis endpoint
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const payload = {
      model: 'openai/gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image in detail' },
          { type: 'image_url', image_url: `data:image/jpeg;base64,${imageBase64}` }
        ]
      }],
      max_tokens: 1000
    };

    const data = await callOpenRouterAPI(payload);
    res.json({ description: data.choices[0].message.content });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ 
      description: "Sorry, I couldn't analyze that image. Please try another one."
    });
  }
});

// All other routes should serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
