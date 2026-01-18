# FireIntel API Interface

A simple, lightweight web UI to interact with the FireIntel API easily.

## Features

- **API Key Management**: Securely store and manage your FireIntel API key locally in your browser
- **Connection Testing**: Quick test to verify your API key and connection
- **Request Builder**: Build and send custom API requests with support for GET, POST, PUT, and DELETE methods
- **Response Viewer**: View formatted JSON responses with syntax highlighting
- **Quick Actions**: Pre-configured buttons for common API endpoints
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Your API key and settings persist across browser sessions

## Getting Started

1. Open `index.html` in your web browser
2. Enter your FireIntel API key (get one from [fireintel.io](https://fireintel.io))
3. Click "Save Key" to store your API key locally
4. Click "Test Connection" to verify your setup
5. Use the Request Builder to make API calls

## Usage

### API Key Configuration

- **Save Key**: Stores your API key in browser local storage
- **Test Connection**: Sends a test request to verify your API key works
- **Clear Key**: Removes your stored API key

### Making Requests

1. Select the HTTP method (GET, POST, PUT, DELETE)
2. Enter the API endpoint (e.g., `/search?query=example`)
3. For POST/PUT requests, add JSON body if needed
4. Click "Send Request"

### Quick Actions

Use the quick action buttons to pre-fill common API endpoints:
- **Search**: Pre-fills the search endpoint
- **User Info**: Pre-fills the user info endpoint
- **Status**: Pre-fills the status endpoint

## Security

- Your API key is stored only in your browser's local storage
- The key is never sent to any server except the FireIntel API
- All communication with the API uses HTTPS

## Documentation

For full API documentation, visit [docs.fireintel.io](https://docs.fireintel.io)

## License

MIT License