let sidebar = null;
let isOpen = false;

function createSidebar() {
  if (sidebar) return;

  sidebar = document.createElement('div');
  sidebar.id = 'ai-assistant-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>AI Assistant</h3>
      <button id="close-sidebar">×</button>
    </div>
    <div class="conversation" id="conversation"></div>
    <div class="input-container">
      <textarea id="chat-input" placeholder="Ask about this page..."></textarea>
      <button id="send-button">Send</button>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  
  document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
  document.getElementById('send-button').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keydown', handleKeyPress);
}

function openSidebar() {
  if (!sidebar) createSidebar();
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  isOpen = true;
}

function closeSidebar() {
  if (sidebar) {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }
  isOpen = false;
}

function toggleSidebar() {
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  input.value = '';
  addMessageToConversation('user', message);
  
  const pageContent = extractPageContent();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'sendToAI',
      message: message,
      pageContent: pageContent,
      url: window.location.href,
      title: document.title
    });
    
    if (response.success) {
      addMessageToConversation('assistant', response.message);
    } else {
      addMessageToConversation('error', response.error || 'Failed to get AI response');
    }
  } catch (error) {
    addMessageToConversation('error', 'Failed to communicate with background script');
  }
}

function addMessageToConversation(role, message) {
  const conversation = document.getElementById('conversation');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = message;
  conversation.appendChild(messageDiv);
  conversation.scrollTop = conversation.scrollHeight;
}

function extractPageContent() {
  const title = document.title;
  const url = window.location.href;
  const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  
  const textContent = mainContent.innerText.substring(0, 3000);
  
  return {
    title,
    url,
    content: textContent
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    toggleSidebar();
    sendResponse({success: true});
  }
});

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    toggleSidebar();
  }
});

createSidebar();