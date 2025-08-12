# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension called "AI Tab Assistant" that allows users to chat with AI about the current tab content using OpenAI or OpenRouter APIs. The extension provides a sidebar interface for conversing with AI about web page content.

## Architecture

### Core Components

- **manifest.json**: Chrome Extension manifest v3 configuration
- **background.js**: Service worker handling AI API calls (OpenAI and OpenRouter)
- **content.js**: Content script injected into web pages, manages sidebar UI and page content extraction
- **popup.js/popup.html**: Extension popup for configuring API settings
- **sidebar.css**: Styling for the injected sidebar interface

### Key Features

- **AI Provider Support**: OpenAI, OpenRouter, and custom OpenAI-compatible APIs (LM Studio, Ollama, etc.)
- **Custom API Endpoints**: Support for local AI servers and custom endpoints
- **Multi-Tab Support**: Independent sidebar instances per tab with no conflicts
- **Page Content Analysis**: Extracts and analyzes current tab content (limited to first 3000 characters)
- **Sidebar Interface**: Slide-out chat interface injected into web pages
- **Keyboard Shortcut**: Ctrl+Shift+A to toggle sidebar
- **Settings Management**: Persistent storage of API keys, endpoints, and model preferences

### Data Flow

1. User opens extension popup to configure API provider, key, model, and optional custom endpoint
2. Settings stored in `chrome.storage.sync`
3. User triggers sidebar via extension icon or keyboard shortcut
4. Content script extracts page content and sends messages to background script
5. Background script makes API calls to configured AI provider (OpenAI, OpenRouter, or custom endpoint)
6. Responses displayed in sidebar chat interface

## Development Commands

This project has no build system or package.json - it's a vanilla JavaScript Chrome extension. Development workflow:

1. Load unpacked extension in Chrome developer mode
2. Point to the project directory
3. Refresh extension after making changes
4. Use Chrome DevTools for debugging:
   - Extension popup: Right-click popup → Inspect
   - Content script: Regular page DevTools
   - Background script: Extensions page → Service worker link

## Multi-Tab Architecture

Each tab runs its own content script instance with:
- **Unique sidebar IDs**: Generated per tab to avoid DOM conflicts
- **Independent state**: Each tab's sidebar operates independently
- **Isolated CSS classes**: Dynamic class names prevent style conflicts
- **Per-tab conversations**: Chat history is separate for each tab

## Testing

- Use the "Test Connection" button in the extension popup to verify API configurations
- For custom endpoints: Test with local AI servers like LM Studio (http://localhost:1234/v1) or Ollama
- Manual testing by interacting with the sidebar on various web pages
- Monitor Chrome extension logs via chrome://extensions in developer mode

## Custom API Configuration

The extension supports OpenAI-compatible APIs through the "Custom OpenAI-compatible" provider option:

- **LM Studio**: Use `http://localhost:1234/v1` (default LM Studio endpoint)
- **Ollama**: Use `http://localhost:11434/v1` (with OpenAI compatibility enabled)
- **Other APIs**: Any endpoint that follows OpenAI's `/chat/completions` format
- **API Key**: Optional for local servers, required for hosted custom APIs
- **Model Names**: Use the exact model name as expected by your custom API

## File Structure

```
chrome-deeper/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for API calls
├── content.js         # Content script for sidebar and page interaction
├── popup.html         # Settings popup UI
├── popup.js           # Settings popup logic
└── sidebar.css        # Sidebar styling
```

## Security Considerations

- API keys stored in Chrome sync storage (encrypted by browser)
- Content extraction limited to 3000 characters to prevent excessive API usage
- Extension requires broad permissions (`<all_urls>`) for content script injection
- External API calls to OpenAI, OpenRouter, and user-configured custom endpoints
- Local API permissions added for localhost and 127.0.0.1 to support LM Studio/Ollama