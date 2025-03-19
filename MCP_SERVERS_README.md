# MCP Servers Documentation

## Overview

This document explains the Model-Controller-Proxy (MCP) servers used in this project and how to manage them.

## MCP Servers

The project includes references to three potential MCP servers:

1. **fetch-mcp**: Fetch utilities server (currently not required)
2. **mcp-filesystem-server**: Filesystem server implementation (currently not required)
3. **browser-tools-mcp**: Browser automation and GitHub integration server (required)

## Required Servers

Currently, only the **browser-tools-mcp** server is required for the application to use browser automation and GitHub functionality. This server needs to be running for the following features to work:

- Browser automation tools (`mcp_puppeteer_*` functions)
- GitHub API integration (`mcp_browser_tools_*` functions)

## Starting MCP Servers

We've created a script that manages the MCP servers:

```
npm run start-mcp
```

This script:

1. Checks if any required servers are already running
2. Creates necessary directory structure, configuration files, and server implementation if needed
3. Installs required dependencies
4. Starts the server in background mode

## Browser Tools MCP Server

The browser-tools-mcp server:

- Runs on port 3025 by default (to match the Chrome extension's expectations)
- Is accessible at http://localhost:3025
- Runs as a background process (detached from terminal)
- Includes endpoints for browser automation and GitHub API functions

When started, the server will continue running in the background and doesn't require keeping a terminal window open.

## Verifying Server Status

To check if the server is running:

```
curl http://localhost:3025
```

You should see the response: "Browser Tools MCP Server is running"

## Finding and Managing the Server Process

Since the server runs as a background process, you can find and manage it using standard process commands:

**Find the process ID:**

```
ps aux | grep server.js
```

**Stop the server:**

```
kill <PID>
```

Where `<PID>` is the process ID shown when starting the server or found using the command above.

## Server Implementation

The browser-tools-mcp server is implemented as a simple Express.js server that:

1. Listens for API requests related to browser automation
2. Handles GitHub API integration
3. Uses Puppeteer for browser automation capabilities
4. Implements the specific endpoints required by the Chrome extension:
   - `/.identity` - For browser extension validation
   - `/current-url` - For receiving URL updates
   - `/screenshot` - For receiving and processing screenshots

## Automatic Setup

The start script handles the complete setup process:

1. If the server directory doesn't exist, it creates it
2. If package.json is missing, it creates one with necessary dependencies
3. If server.js is missing, it creates a basic implementation
4. Installs all required npm dependencies

## Starting on Application Launch

For consistent operation, it's recommended to start the MCP servers before using any browser automation or GitHub features. You can add this to your application startup process or run it manually before using those features.
