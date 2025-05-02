const faq = {
  "how to send photos on whatsapp": "1. Open WhatsApp chat. 2. Tap the attach/paperclip icon. 3. Choose 'Gallery' or 'Camera'. 4. Select your photo and tap send.",
  "how to pay with paytm": "1. Open Paytm app. 2. Tap 'Scan & Pay'. 3. Scan QR code. 4. Enter amount and tap 'Pay'.",
  "tell me a fun fact": "Did you know? The shortest war in history was between Britain and Zanzibar in 1896. Zanzibar surrendered after 38 minutes!",
  "what is google pay": "Google Pay is a digital wallet app by Google for sending and receiving money using your mobile number or UPI.",
  "how to use google maps": "1. Open Google Maps. 2. Enter your destination. 3. Tap 'Directions'. 4. Choose travel mode and follow the route."
};

// DOM elements
const picker = document.getElementById('emoji-picker');
const emojiBtn = document.getElementById('emoji-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const themeBtn = document.getElementById('theme-btn');
const body = document.body;
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.querySelector('.close-modal');
const chatForm = document.getElementById('chat-form');

// Backend URL
const BACKEND_URL = 'https://dlcfunbot-backend.onrender.com';

// Initialize emoji picker
document.addEventListener('DOMContentLoaded', function() {
  // Emoji picker toggle
  emojiBtn.addEventListener('click', () => {
    picker.classList.toggle('hidden');
  });

  // Attach file click handler
  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change handler
  fileInput.addEventListener('change', handleFileUpload);
  
  // Emoji selection handler
  picker.addEventListener('emoji-click', event => {
    const input = document.getElementById('user-input');
    input.value += event.detail.unicode;
    picker.classList.add('hidden');
  });

  // Quick reply buttons
  document.querySelectorAll('.quick-reply').forEach(button => {
    button.addEventListener('click', function() {
      const question = this.getAttribute('data-question');
      document.getElementById('user-input').value = question;
      setTimeout(() => {
        chatForm.dispatchEvent(new Event('submit'));
      }, 200);
    });
  });

  // Help modal
  helpBtn.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    helpModal.classList.add('hidden');
  });

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add('hidden');
    }
  });

  // Theme toggle
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark-theme');
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6c5ce7', '#a29bfe', '#00cec9']
    });
  });
});

// Chat form submission
chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  
  if (fileInput.files.length > 0) {
    handleFileUpload();
    return;
  }
  
  if (message === '') return;

  addMessage(message, 'user-message');
  input.value = '';

  const reply = getBotReply(message.toLowerCase());
  if (reply) {
    setTimeout(() => {
      addMessage(reply, 'bot-message');
    }, 500);
  } else {
    const typingIndicator = createTypingIndicator();
    document.getElementById('chat-box').appendChild(typingIndicator);
    scrollToBottom();
    
    fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: message })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('chat-box').removeChild(typingIndicator);
      const formattedResponse = formatResponse(data.reply);
      addMessage(formattedResponse, 'bot-message');
    })
    .catch(err => {
      document.getElementById('chat-box').removeChild(typingIndicator);
      addMessage("Sorry, I'm having trouble connecting. Please try again later. 😔", 'bot-message');
    });
  }
});

function handleFileUpload() {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.className = 'attachment-preview';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <div class="avatar user-avatar">You</div>
      </div>
      <div class="message-content">
        <div class="message-text"></div>
        <div class="message-time">${timeString}</div>
      </div>
    `;
    
    messageDiv.querySelector('.message-text').appendChild(img);
    document.getElementById('chat-box').appendChild(messageDiv);
    scrollToBottom();
    
    // Send image to backend for analysis
    const typingIndicator = createTypingIndicator();
    document.getElementById('chat-box').appendChild(typingIndicator);
    
    const formData = new FormData();
    formData.append('image', file);
    
    fetch(`${BACKEND_URL}/analyze-image`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('chat-box').removeChild(typingIndicator);
      addMessage(data.description, 'bot-message');
    })
    .catch(err => {
      document.getElementById('chat-box').removeChild(typingIndicator);
      addMessage("I couldn't analyze that image. Please try another one.", 'bot-message');
    });
    
    fileInput.value = '';
  };
  reader.readAsDataURL(file);
}

function addMessage(text, className) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.className = className;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <div class="avatar ${className === 'bot-message' ? 'bot-avatar' : 'user-avatar'}">
        ${className === 'bot-message' ? 'DLC' : 'You'}
      </div>
    </div>
    <div class="message-content">
      <div class="message-text">${text}</div>
      <div class="message-time">${timeString}</div>
    </div>
  `;
  
  chatBox.appendChild(messageDiv);
  scrollToBottom();
}

function createTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot-message';
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <div class="avatar bot-avatar">DLC</div>
    </div>
    <div class="message-content">
      <div class="message-text typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  return typingDiv;
}

function getBotReply(msg) {
  for (let key in faq) {
    if (msg.includes(key)) return faq[key];
  }
  return null;
}

function formatResponse(text) {
  if (/\d\./.test(text)) {
    text = text.replace(/(\d\.)/g, '•');
    text = text.replace(/\n/g, '<br>');
    return text;
  }
  return text;
}

function scrollToBottom() {
  const chatBox = document.getElementById('chat-box');
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add typing indicator CSS
const style = document.createElement('style');
style.textContent = `
  .typing-indicator {
    display: flex;
    align-items: center;
    height: 20px;
  }
  .typing-indicator span {
    width: 6px;
    height: 6px;
    margin: 0 2px;
    background-color: #666;
    border-radius: 50%;
    display: inline-block;
    animation: typing 1s infinite ease-in-out;
  }
  .typing-indicator span:nth-child(1) {
    animation-delay: 0s;
  }
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes typing {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`;
document.head.appendChild(style);
