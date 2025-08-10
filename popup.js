document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const providerSelect = document.getElementById('provider');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const testButton = document.getElementById('testButton');
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
    ]
  };

  providerSelect.addEventListener('change', function() {
    const provider = this.value;
    if (provider && modelSuggestions[provider]) {
      modelHints.textContent = `Popular models: ${modelSuggestions[provider].join(', ')}`;
    } else {
      modelHints.textContent = '';
    }

    if (provider === 'openai') {
      modelInput.placeholder = 'e.g., gpt-3.5-turbo';
    } else if (provider === 'openrouter') {
      modelInput.placeholder = 'e.g., openai/gpt-3.5-turbo';
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

  function loadSettings() {
    chrome.storage.sync.get(['provider', 'apiKey', 'model'], function(result) {
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
    });
  }

  function saveSettings() {
    const settings = {
      provider: providerSelect.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };

    if (!settings.provider) {
      showStatus('Please select a provider', 'error');
      return;
    }

    if (!settings.apiKey) {
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

    if (!provider || !apiKey) {
      showStatus('Please fill in provider and API key first', 'error');
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

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});