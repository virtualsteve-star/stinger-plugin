# Stinger Guard Installation Guide

## Prerequisites

- Google Chrome (version 88 or higher)
- Stinger API running on `http://localhost:8888`
- Administrator access to install Chrome extensions

## Installation Steps

### 1. Download the Extension

```bash
# Clone the repository
git clone https://github.com/virtualsteve-star/stinger-plugin.git
cd stinger-plugin

# Install dependencies
npm install

# Build the extension
npm run build
```

The built extension will be in the `dist/` directory.

### 2. Install in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from the build
5. The Stinger Guard extension should appear in your extensions list

### 3. Verify Installation

1. Look for the shield icon in Chrome toolbar
2. Click the icon to open the popup
3. You should see "API: Connected" if the Stinger API is running

### 4. Configure the Extension

1. Click the Stinger Guard icon
2. Enter your user information:
   - **User ID**: Your email address
   - **Display Name**: Your full name
3. Verify API endpoint (default: `http://localhost:8888`)
4. Click **Save Config**

### 5. Test the Extension

1. Navigate to https://chat.openai.com
2. Open Chrome DevTools (F12) and check the Console
3. You should see: "Stinger Guard initialized successfully"
4. Try typing a test prompt to verify interception

## Enterprise Deployment

### Option 1: CRX Package

For enterprise deployment, create a .crx package:

```bash
# Build for production
npm run build

# Package as CRX (requires Chrome)
# In Chrome, go to chrome://extensions/
# Click "Pack extension"
# Select the dist/ directory
# This creates dist.crx and dist.pem
```

### Option 2: Chrome Web Store (Future)

For wider distribution:
1. Create Chrome Developer account
2. Upload to Chrome Web Store
3. Can be private (unlisted) or public

### Option 3: Group Policy

For managed Chrome installations:

```json
{
  "ExtensionInstallForcelist": [
    "extensionid;file:///path/to/extension.crx"
  ]
}
```

## Configuration Options

### Popup Settings

- **User ID**: Email or unique identifier for audit logs
- **Display Name**: Human-readable name
- **API Endpoint**: Stinger API URL (default: http://localhost:8888)

### Advanced Configuration

Edit settings in Chrome Storage:
1. Open DevTools on any page
2. Go to Application > Storage > Local Storage
3. Find `chrome-extension://[extension-id]`
4. Modify config values

## Troubleshooting

### Extension Not Loading

- Check Chrome version (must be 88+)
- Verify Developer mode is enabled
- Check for errors in chrome://extensions/

### API Connection Failed

```bash
# Test API connection
curl http://localhost:8888/health

# Should return:
{
  "status": "healthy",
  "pipeline_available": true
}
```

### Content Script Not Working

1. Refresh the ChatGPT page
2. Check permissions in manifest.json
3. Look for errors in DevTools Console

### No Interception Happening

1. Ensure extension is enabled
2. Check that you're on https://chat.openai.com
3. Try disabling other extensions that might conflict

## Updating the Extension

1. Pull latest changes: `git pull`
2. Rebuild: `npm run build`
3. In chrome://extensions/, click refresh icon on Stinger Guard
4. Reload any open ChatGPT tabs

## Uninstallation

1. Go to chrome://extensions/
2. Find Stinger Guard
3. Click **Remove**
4. Confirm removal

## Security Notes

- The extension only activates on ChatGPT domains
- No data is stored locally (except configuration)
- All sensitive data checking happens on the Stinger API
- Audit logs are centralized on the server

## Support

For issues or questions:
- GitHub Issues: https://github.com/virtualsteve-star/stinger-plugin/issues
- Check logs in Chrome DevTools Console
- API logs: Check Stinger API output

## Next Steps

After installation:
1. Review [Demo Scenarios](demo-scenarios.md)
2. Configure your security policies in Stinger API
3. Test with real use cases
4. Plan organization-wide rollout