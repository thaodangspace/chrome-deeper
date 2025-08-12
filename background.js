chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToAI') {
    handleAIRequest(request, sendResponse);
    return true;
  }
});

async function handleAIRequest(request, sendResponse) {
  try {
    console.log('Background script received request:', request.action);
    const settings = await getSettings();
    console.log('Settings loaded:', { ...settings, apiKey: settings.apiKey ? '[HIDDEN]' : 'none' });
    
    // Check if provider is configured
    if (!settings.provider) {
      sendResponse({
        success: false,
        error: 'Please select an AI provider in the extension popup'
      });
      return;
    }

    // Check if API key is required (not required for some custom APIs)
    if (!settings.apiKey && settings.provider !== 'custom') {
      sendResponse({
        success: false,
        error: 'Please configure your API key in the extension popup'
      });
      return;
    }

    // For custom provider, check if endpoint is provided
    if (settings.provider === 'custom' && !settings.customEndpoint) {
      sendResponse({
        success: false,
        error: 'Please configure your custom API endpoint in the extension popup'
      });
      return;
    }

    console.log('Making API call...');
    const response = await callAI(settings, request);
    console.log('API call completed successfully');
    sendResponse(response);
  } catch (error) {
    console.error('Background script error:', error);
    sendResponse({
      success: false,
      error: `Request failed: ${error.message || 'Unknown error'}`
    });
  }
}

function detectLanguage(text) {
  // Simple language detection based on character patterns and common words
  const patterns = {
    'Chinese': /[\u4e00-\u9fff]/, // Chinese characters
    'Japanese': /[\u3040-\u309f\u30a0-\u30ff]/, // Hiragana and Katakana
    'Korean': /[\uac00-\ud7af]/, // Hangul
    'Arabic': /[\u0600-\u06ff]/, // Arabic script
    'Russian': /[\u0400-\u04ff]/, // Cyrillic
    'Thai': /[\u0e00-\u0e7f]/, // Thai
    'Vietnamese': /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
    'French': /(je|le|la|les|de|et|un|une|vous|tu|il|elle|avec|pour|par|sur|dans|être|avoir|faire|dire|aller|voir|savoir|pouvoir|falloir|vouloir|venir|prendre|donner|mettre|tenir|sembler|laisser|devenir|croire|porter|regarder|suivre|trouver|rendre|passer|jouer|arriver|entendre|rester|sortir|partir|parler|demander|comprendre|attendre|vivre|écrire)/i,
    'Spanish': /(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al|una|sur|del|las|los|como|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|mi|mis|tú|te|ti|tu|tus|ellas|nosotras|vosotros|vosotras|os|mío|mía|míos|mías|tuyo|tuya|tuyos|tuyas|suyo|suya|suyos|suyas|nuestro|nuestra|nuestros|nuestras|vuestro|vuestra|vuestros|vuestras|esos|esas)/i,
    'German': /(der|die|das|und|in|den|von|zu|das|mit|sich|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|sind|noch|wie|einem|über|einen|so|zum|war|haben|nur|oder|aber|vor|zur|bis|unter|während|des)/i,
    'Italian': /(il|di|che|e|la|per|un|in|con|del|da|non|a|le|si|nel|lo|una|su|come|dalla|dei|più|nel|tutto|anche|loro|molto|dove|quello|quando|questo|ogni|gli|tra|stesso|senza|fa|essere|ho|ha|abbiamo|avete|hanno|sono|sei|è|siamo|siete|fare|sto|stai|sta|stiamo|state|stanno)/i,
    'Portuguese': /(o|a|de|que|e|do|da|em|um|para|é|com|não|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das|tem|à|seu|sua|ou|ser|quando|muito|há|nos|já|está|eu|também|só|pelo|pela|até|isso|ela|entre|era|depois|sem|mesmo|aos|ter|seus|suas|numa|pelos|pelas|esse|essa|meu|minha|meus|minhas|nosso|nossa|nossos|nossas|dele|dela|deles|delas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas)/i
  };

  // Check for non-Latin scripts first
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (['Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Thai', 'Vietnamese'].includes(lang)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
  }

  // For Latin-based languages, count matches
  const latinLanguages = ['French', 'Spanish', 'German', 'Italian', 'Portuguese'];
  let maxMatches = 0;
  let detectedLang = 'English'; // Default

  for (const lang of latinLanguages) {
    const matches = (text.match(patterns[lang]) || []).length;
    if (matches > maxMatches && matches > 2) { // Require at least 3 matches
      maxMatches = matches;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

async function callAI(settings, request) {
  const { provider, apiKey, model, customEndpoint } = settings;
  const { message, pageContent, url, title } = request;

  // Detect the language of the user's message
  const userLanguage = detectLanguage(message);
  
  // Create language-specific instruction
  const languageInstruction = userLanguage !== 'English' 
    ? `IMPORTANT: The user wrote their message in ${userLanguage}. Please respond in ${userLanguage} language.`
    : '';

  const systemPrompt = `You are an AI assistant that helps users understand and analyze web pages. The user is currently viewing a page titled "${title}" at ${url}. Here's the page content:

${pageContent.content}

${languageInstruction}

Please provide helpful, accurate responses about this page content. Keep your responses concise and relevant.`;

  if (provider === 'openai') {
    return await callOpenAI(apiKey, model, systemPrompt, message);
  } else if (provider === 'openrouter') {
    return await callOpenRouter(apiKey, model, systemPrompt, message);
  } else if (provider === 'custom') {
    return await callCustomAPI(customEndpoint, apiKey, model, systemPrompt, message);
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

async function callCustomAPI(endpoint, apiKey, model, systemPrompt, userMessage) {
  // Clean and construct the API URL
  let apiUrl = endpoint.trim();
  
  // Remove trailing slash if present
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }
  
  // Handle different API server patterns
  if (!apiUrl.includes('/chat/completions') && !apiUrl.includes('/completions')) {
    // For standard OpenAI-compatible APIs
    if (!apiUrl.endsWith('/v1')) {
      apiUrl += '/v1';
    }
    apiUrl += '/chat/completions';
  } else if (apiUrl.endsWith('/completions')) {
    // Some servers use /completions instead of /chat/completions
    apiUrl = apiUrl.replace('/completions', '/chat/completions');
  }

  console.log('Custom API URL:', apiUrl);

  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key to headers if provided (some local APIs don't require it)
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const requestBody = {
    model: model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 1000,
    temperature: 0.7
  };

  console.log('Custom API request:', { url: apiUrl, headers, body: requestBody });

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout (30 seconds)')), 30000)
  );

  try {
    const response = await Promise.race([
      fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      }),
      timeoutPromise
    ]);

    console.log('Custom API response status:', response.status, response.statusText);

    // Check if response is OK
    if (!response.ok) {
      let errorText;
      try {
        const errorJson = await response.json();
        errorText = errorJson.error?.message || errorJson.message || `HTTP ${response.status}`;
      } catch {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorText);
    }

    // Parse response
    const data = await response.json();
    console.log('Custom API response data:', data);

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from custom API');
    }

    return {
      success: true,
      message: data.choices[0].message.content
    };

  } catch (error) {
    console.error('Custom API error:', error);
    throw new Error(`Custom API failed: ${error.message}`);
  }
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'provider', 'model', 'customEndpoint'], (result) => {
      resolve(result);
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
});