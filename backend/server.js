const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend statically
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/ask', async (req, res) => {
  const userQuestion = req.body.question;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'YOUR_SITE_URL', // Optional
        'X-Title': 'DLC Chatbot' // Optional
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // You can change this to any model supported by OpenRouter
        messages: [{ role: 'user', content: userQuestion }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('OpenRouter error:', err);
    res.status(500).json({ reply: `AI error: ${err.message}` });
  }
});

// Fallback for frontend routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Chatbot server running on http://localhost:${PORT}`);
});