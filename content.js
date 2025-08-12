let sidebar = null;
let isOpen = false;
let sidebarId = null;

function generateSidebarId() {
  return 'ai-assistant-sidebar-' + Math.random().toString(36).substr(2, 9);
}

function createSidebar() {
  if (sidebar) return;

  sidebarId = generateSidebarId();
  sidebar = document.createElement('div');
  sidebar.id = sidebarId;
  sidebar.className = 'ai-assistant-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>AI Assistant</h3>
      <div class="header-buttons">
        <button class="clear-chat" title="Start new conversation">🗑️</button>
        <button class="close-sidebar">×</button>
      </div>
    </div>
    <div class="conversation"></div>
    <div class="input-container">
      <textarea class="chat-input" placeholder="Ask about this page..."></textarea>
      <button class="send-button">Send</button>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  
  sidebar.querySelector('.close-sidebar').addEventListener('click', closeSidebar);
  sidebar.querySelector('.clear-chat').addEventListener('click', clearChat);
  sidebar.querySelector('.send-button').addEventListener('click', sendMessage);
  sidebar.querySelector('.chat-input').addEventListener('keydown', handleKeyPress);
}

function openSidebar() {
  if (!sidebar) createSidebar();
  sidebar.classList.add('open');
  // Add a unique class to body to avoid conflicts with other tabs
  document.body.classList.add('sidebar-open-' + sidebarId);
  isOpen = true;
}

function closeSidebar() {
  if (sidebar) {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open-' + sidebarId);
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

function clearChat() {
  if (!sidebar) return;
  const conversation = sidebar.querySelector('.conversation');
  conversation.innerHTML = '';
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const input = sidebar.querySelector('.chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  input.value = '';
  addMessageToConversation('user', message);
  
  // Show loading message
  const loadingId = 'loading-' + Date.now();
  addMessageToConversation('assistant', 'Thinking...', loadingId);
  
  const pageContent = extractPageContent();
  
  try {
    console.log('Sending message to background script');
    const response = await chrome.runtime.sendMessage({
      action: 'sendToAI',
      message: message,
      pageContent: pageContent,
      url: window.location.href,
      title: document.title
    });
    
    console.log('Response from background script:', response);
    
    if (!response) {
      addMessageToConversation('error', 'No response from background script. Check if extension is properly loaded.');
      return;
    }
    
    // Remove loading message
    removeMessageFromConversation(loadingId);
    
    if (response.success) {
      addMessageToConversation('assistant', response.message);
    } else {
      addMessageToConversation('error', response.error || 'Failed to get AI response');
    }
  } catch (error) {
    // Remove loading message
    removeMessageFromConversation(loadingId);
    
    console.error('Content script error:', error);
    if (chrome.runtime.lastError) {
      addMessageToConversation('error', `Extension error: ${chrome.runtime.lastError.message}`);
    } else {
      addMessageToConversation('error', `Communication failed: ${error.message || 'Unknown error'}`);
    }
  }
}

function parseMarkdown(text) {
  if (!text) return '';
  
  // Convert markdown to HTML
  return text
    // Bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code `text`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks ```text```
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

function addMessageToConversation(role, message, id) {
  const conversation = sidebar.querySelector('.conversation');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  if (id) messageDiv.id = id;
  
  // Parse markdown for assistant messages, use plain text for others
  if (role === 'assistant') {
    messageDiv.innerHTML = parseMarkdown(message);
  } else {
    messageDiv.textContent = message;
  }
  
  conversation.appendChild(messageDiv);
  conversation.scrollTop = conversation.scrollHeight;
}

function removeMessageFromConversation(id) {
  if (!id) return;
  const messageDiv = sidebar.querySelector(`#${id}`);
  if (messageDiv) {
    messageDiv.remove();
  }
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