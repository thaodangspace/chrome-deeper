chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToAI') {
    handleAIRequest(request, sendResponse);
    return true;
  }
});

async function handleAIRequest(request, sendResponse) {
  try {
    const settings = await getSettings();
    
    if (!settings.apiKey || !settings.provider) {
      sendResponse({
        success: false,
        error: 'Please configure your API settings in the extension popup'
      });
      return;
    }

    const response = await callAI(settings, request);
    sendResponse(response);
  } catch (error) {
    console.error('Background script error:', error);
    sendResponse({
      success: false,
      error: 'An error occurred while processing your request'
    });
  }
}

async function callAI(settings, request) {
  const { provider, apiKey, model } = settings;
  const { message, pageContent, url, title } = request;

  const systemPrompt = `You are an AI assistant that helps users understand and analyze web pages. The user is currently viewing a page titled "${title}" at ${url}. Here's the page content:

${pageContent.content}

Please provide helpful, accurate responses about this page content. Keep your responses concise and relevant.`;

  if (provider === 'openai') {
    return await callOpenAI(apiKey, model, systemPrompt, message);
  } else if (provider === 'openrouter') {
    return await callOpenRouter(apiKey, model, systemPrompt, message);
  }

  throw new Error('Unsupported provider');
}

async function callOpenAI(apiKey, model, systemPrompt, userMessage) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return {
    success: true,
    message: data.choices[0].message.content
  };
}

async function callOpenRouter(apiKey, model, systemPrompt, userMessage) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/your-repo/ai-tab-assistant',
      'X-Title': 'AI Tab Assistant'
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenRouter API request failed');
  }

  const data = await response.json();
  return {
    success: true,
    message: data.choices[0].message.content
  };
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'provider', 'model'], (result) => {
      resolve(result);
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
});