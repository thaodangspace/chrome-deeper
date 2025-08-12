document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const providerSelect = document.getElementById('provider');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const customEndpointInput = document.getElementById('customEndpoint');
  const customEndpointGroup = document.getElementById('customEndpointGroup');
  const testButton = document.getElementById('testButton');
  const toggleSidebarButton = document.getElementById('toggleSidebarButton');
  const statusDiv = document.getElementById('status');
  const modelHints = document.getElementById('modelHints');

  const modelSuggestions = {
    openai: [
      'gpt-3.5-turbo (recommended)',
      'gpt-4',
      'gpt-4-turbo'
    ],
    openrouter: [
      'openai/gpt-3.5-turbo',
      'openai/gpt-4',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct'
    ],
    custom: [
      'LM Studio: Use loaded model name',
      'Ollama: model-name:latest', 
      'Text Generation WebUI: model name',
      'Or check your server documentation'
    ]
  };

  providerSelect.addEventListener('change', function() {
    const provider = this.value;
    
    // Show/hide custom endpoint field
    if (provider === 'custom') {
      customEndpointGroup.style.display = 'block';
    } else {
      customEndpointGroup.style.display = 'none';
    }
    
    if (provider && modelSuggestions[provider]) {
      modelHints.textContent = `Popular models: ${modelSuggestions[provider].join(', ')}`;
    } else {
      modelHints.textContent = '';
    }

    if (provider === 'openai') {
      modelInput.placeholder = 'e.g., gpt-3.5-turbo';
    } else if (provider === 'openrouter') {
      modelInput.placeholder = 'e.g., openai/gpt-3.5-turbo';
    } else if (provider === 'custom') {
      modelInput.placeholder = 'e.g., llama-3.2-3b-instruct';
    }
  });

  loadSettings();

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettings();
  });

  testButton.addEventListener('click', function() {
    testConnection();
  });

  toggleSidebarButton.addEventListener('click', function() {
    toggleSidebar();
  });

  function loadSettings() {
    chrome.storage.sync.get(['provider', 'apiKey', 'model', 'customEndpoint'], function(result) {
      if (result.provider) {
        providerSelect.value = result.provider;
        providerSelect.dispatchEvent(new Event('change'));
      }
      if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
      }
      if (result.model) {
        modelInput.value = result.model;
      }
      if (result.customEndpoint) {
        customEndpointInput.value = result.customEndpoint;
      }
    });
  }

  function saveSettings() {
    const settings = {
      provider: providerSelect.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };

    // Add custom endpoint if custom provider is selected
    if (settings.provider === 'custom') {
      settings.customEndpoint = customEndpointInput.value;
      if (!settings.customEndpoint) {
        showStatus('Please enter a custom API endpoint', 'error');
        return;
      }
    }

    if (!settings.provider) {
      showStatus('Please select a provider', 'error');
      return;
    }

    if (!settings.apiKey && settings.provider !== 'custom') {
      showStatus('Please enter an API key', 'error');
      return;
    }

    chrome.storage.sync.set(settings, function() {
      showStatus('Settings saved successfully!', 'success');
    });
  }

  async function testConnection() {
    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value;
    const model = modelInput.value;
    const customEndpoint = customEndpointInput.value;

    if (!provider) {
      showStatus('Please select a provider first', 'error');
      return;
    }

    if (provider === 'custom' && !customEndpoint) {
      showStatus('Please enter a custom API endpoint', 'error');
      return;
    }

    if (!apiKey && provider !== 'custom') {
      showStatus('Please fill in API key first', 'error');
      return;
    }

    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendToAI',
        message: 'Hello, this is a test message.',
        pageContent: {
          title: 'Test Page',
          url: 'https://example.com',
          content: 'This is a test page content.'
        }
      });

      if (response.success) {
        showStatus('Connection successful!', 'success');
      } else {
        showStatus(`Connection failed: ${response.error}`, 'error');
      }
    } catch (error) {
      showStatus(`Test failed: ${error.message}`, 'error');
    } finally {
      testButton.disabled = false;
      testButton.textContent = 'Test Connection';
    }
  }

  async function toggleSidebar() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab) {
        showStatus('No active tab found', 'error');
        return;
      }

      await chrome.tabs.sendMessage(tab.id, {action: 'toggleSidebar'});
      showStatus('Sidebar toggled successfully', 'success');
    } catch (error) {
      showStatus('Failed to toggle sidebar. Make sure you\'re on a web page.', 'error');
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});