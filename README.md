# AI Tab Assistant

A Chrome Extension that enables users to chat with AI about the current tab's content using OpenAI, OpenRouter, or custom OpenAI-compatible APIs.

## Features

- **Multiple AI Provider Support**: OpenAI, OpenRouter, and custom OpenAI-compatible APIs
- **Local AI Support**: Works with LM Studio, Ollama, and other local AI servers
- **Sidebar Interface**: Clean, slide-out chat interface injected into web pages
- **Multi-Tab Support**: Independent sidebar instances per tab with no conflicts
- **Page Content Analysis**: Automatically extracts and analyzes current tab content
- **Keyboard Shortcut**: Quick access with `Ctrl+Shift+A`
- **Persistent Settings**: API keys and preferences stored securely

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the project directory
5. The extension will appear in your Chrome toolbar

## Setup

1. Click the AI Tab Assistant icon in the Chrome toolbar
2. Configure your AI provider:
   - **OpenAI**: Enter your OpenAI API key and select a model
   - **OpenRouter**: Enter your OpenRouter API key and model name
   - **Custom API**: Enter endpoint URL (e.g., `http://localhost:1234/v1` for LM Studio)
3. Click "Test Connection" to verify your settings
4. Click "Save" to store your configuration

## Usage

### Opening the Sidebar
- Click the extension icon, or
- Use the keyboard shortcut `Ctrl+Shift+A`

### Chatting with AI
1. Open the sidebar on any web page
2. The AI will have access to the current page content (first 3000 characters)
3. Type your questions or requests in the chat interface
4. The AI can help analyze, summarize, or discuss the current page content

## Supported AI Providers

### OpenAI
- Standard OpenAI API with models like GPT-3.5, GPT-4, etc.
- Requires OpenAI API key

### OpenRouter
- Access to multiple AI models through OpenRouter
- Requires OpenRouter API key and model specification

### Custom OpenAI-Compatible APIs
Perfect for local AI setups:
- **LM Studio**: `http://localhost:1234/v1`
- **Ollama**: `http://localhost:11434/v1` (with OpenAI compatibility enabled)
- **Other APIs**: Any endpoint following OpenAI's `/chat/completions` format

## Development

This is a vanilla JavaScript Chrome extension with no build process required.

### File Structure
```
chrome-deeper/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for API calls
├── content.js         # Content script for sidebar and page interaction
├── popup.html         # Settings popup UI
├── popup.js           # Settings popup logic
├── sidebar.css        # Sidebar styling
└── README.md          # This file
```

### Development Workflow
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AI Tab Assistant extension
4. Test your changes

### Debugging
- **Extension popup**: Right-click popup → Inspect
- **Content script**: Use regular page DevTools (F12)
- **Background script**: Go to Extensions page → Click "Service worker" link
- **Extension logs**: Check `chrome://extensions/` in developer mode

## Architecture

### Multi-Tab Support
Each tab runs its own content script instance with:
- Unique sidebar IDs to avoid DOM conflicts
- Independent conversation state
- Isolated CSS classes with dynamic names

### Data Flow
1. User configures API settings via popup
2. Settings stored in Chrome sync storage
3. User opens sidebar (icon or keyboard shortcut)
4. Content script extracts page content
5. Messages sent to background script
6. Background script calls configured AI API
7. Responses displayed in sidebar

## Security & Privacy

- API keys stored in Chrome's encrypted sync storage
- Page content limited to first 3000 characters
- External API calls only to configured providers
- No data stored on external servers (except API provider interactions)

## Permissions

The extension requires the following permissions:
- `activeTab`: Access current tab content
- `storage`: Store API keys and settings
- `scripting`: Inject sidebar into pages
- `<all_urls>`: Content script injection on all sites
- Specific host permissions for API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the extension
5. Submit a pull request

## License

[Add your preferred license here]

## Troubleshooting

### Connection Issues
- Use "Test Connection" button to verify API settings
- Check that your API key is valid and has sufficient credits
- For local APIs, ensure the server is running on the specified port

### Sidebar Not Appearing
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page and using the keyboard shortcut
- Check browser console for any JavaScript errors

### Custom API Not Working
- Verify the endpoint URL format includes `/v1` suffix
- Ensure your local AI server supports OpenAI-compatible API format
- Check that the server is accessible from the browser