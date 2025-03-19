# Browser Tools Chrome Extension Setup Guide

This guide will help you install and configure the BrowserTools MCP Chrome extension to work properly with the MCP server.

## Prerequisites

1. Make sure the MCP server is running on port 3025:

   ```
   npm run start-mcp
   ```

2. Verify the server is running by checking:
   ```
   curl http://localhost:3025/.identity
   ```
   This should return: `{"signature":"mcp-browser-connector-24x7","version":"1.0.0","name":"Browser Tools MCP Server"}`

## Installation Steps

1. Open Chrome and navigate to: `chrome://extensions/`

2. Enable "Developer mode" by toggling the switch in the top-right corner

3. Click "Load unpacked" in the top-left corner

4. Navigate to the following directory:

   ```
   /Users/showboatstudio/locker/MCPS/dynamodb-airtable-migration/browser-tools-extension
   ```

5. Select the directory to install the extension

## Verification Steps

1. After installation, find the BrowserTools MCP extension in the list

2. Click the "Details" button

3. Check the following important settings:

   - Ensure "Site access" is set to "On all sites" (or edit the extension and reload it)
   - Make sure the extension is toggled to "On"

4. Open Chrome DevTools (Right-click > Inspect or press F12)

   - Go to the "Console" tab
   - Check for any error messages related to the extension

5. If you see "service worker inactive", try:
   - Click the "service worker (inactive)" link to open its console
   - Check for errors in the service worker's console
   - Try reloading the extension

## Troubleshooting

If you're still experiencing connection issues:

1. **Chrome Console Errors:**

   - Open Chrome DevTools and check the Console for error messages
   - Look for "Failed to fetch" or "Cannot connect to server" errors

2. **Server Port Mismatch:**

   - Ensure the server is running on port 3025
   - Check that the extension is configured to connect to port 3025

3. **Extension Reload:**

   - Try disabling and re-enabling the extension
   - Click the refresh icon on the extension card in chrome://extensions/

4. **Browser Restart:**

   - Completely close and restart Chrome
   - Make sure the MCP server is running before opening Chrome

5. **Extension Reinstall:**

   - Uninstall the extension completely
   - Restart Chrome
   - Install the extension again

6. **Check Server Logs:**
   - Monitor the MCP server terminal output for connection attempts
   - Look for successful/failed identity validations

## Checking Extension Permissions

To check Chrome's extension permissions for accessing localhost:3025:

1. Go to Chrome's Extensions page by typing `chrome://extensions/` in the address bar
2. Find the BrowserTools MCP extension in the list
3. Click on "Details" for the extension
4. Scroll down to the "Site access" section
5. Make sure it's set to "On all sites" or specifically includes localhost
