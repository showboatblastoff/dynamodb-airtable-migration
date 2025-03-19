#!/usr/bin/env node

/**
 * Script to start MCP servers if needed
 *
 * Currently, the browser-tools-mcp server is required for browser and GitHub automation.
 */

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

console.log("Starting MCP servers...");

// Define servers that need to be started
const servers = [
  {
    name: "fetch-mcp",
    directory: path.join(__dirname, "fetch-mcp"),
    startCmd: "npm",
    startArgs: ["start"],
    required: false,
    defaultPort: 3000,
  },
  {
    name: "mcp-filesystem-server",
    directory: path.join(__dirname, "mcp-filesystem-server"),
    startCmd: "npm",
    startArgs: ["start"],
    required: false,
    defaultPort: 3001,
  },
  {
    name: "browser-tools-mcp",
    directory: path.join(__dirname, "browser-tools-mcp"),
    startCmd: "npm",
    startArgs: ["start"],
    required: true,
    defaultPort: 3025,
    fallbackStart: true,
  },
];

// Check if server is already running on port
function checkServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        method: "HEAD",
        host: "localhost",
        port: port,
        path: "/",
        timeout: 1000,
      },
      (res) => {
        resolve(true);
      }
    );

    req.on("error", () => {
      resolve(false);
    });

    req.end();
  });
}

// Main function to check and start servers
async function startServers() {
  console.log("Checking and starting required servers...");

  for (const server of servers) {
    // Skip non-required servers that don't exist
    if (!server.required && !fs.existsSync(server.directory)) {
      console.log(
        `${server.name} directory not found. Skipping as it's not required.`
      );
      continue;
    }

    // Check if server has package.json and start script
    if (!server.fallbackStart) {
      const packageJsonPath = path.join(server.directory, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        if (server.required) {
          console.error(`${server.name} has no package.json but is required!`);
        } else {
          console.log(`${server.name} has no package.json. Skipping.`);
          continue;
        }
      } else {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );
          if (!packageJson.scripts || !packageJson.scripts.start) {
            console.log(`${server.name} has no start script. Skipping.`);
            continue;
          }
        } catch (error) {
          console.error(
            `Error reading package.json for ${server.name}:`,
            error
          );
          continue;
        }
      }
    }

    // Check if already running
    let isRunning = false;
    if (server.defaultPort) {
      isRunning = await checkServerRunning(server.defaultPort);
      if (isRunning) {
        console.log(
          `${server.name} appears to be already running on port ${server.defaultPort}.`
        );
        continue;
      }
    }

    // For browser-tools-mcp, special handling to ensure it exists and is set up properly
    if (server.name === "browser-tools-mcp" && server.required) {
      const serverDir = server.directory;

      // Create directory if it doesn't exist
      if (!fs.existsSync(serverDir)) {
        console.log(`Creating ${server.name} directory...`);
        fs.mkdirSync(serverDir, { recursive: true });
      }

      // Create package.json if it doesn't exist
      const packageJsonPath = path.join(serverDir, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        console.log(`Creating package.json for ${server.name}...`);

        const packageJson = {
          name: "browser-tools-mcp",
          version: "1.0.0",
          description: "Browser tools MCP server",
          main: "server.js",
          scripts: {
            start: "node server.js",
          },
          dependencies: {
            express: "^4.18.2",
            puppeteer: "^21.3.8",
          },
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }

      // Create server.js if it doesn't exist
      const serverJsPath = path.join(serverDir, "server.js");
      if (!fs.existsSync(serverJsPath)) {
        console.log(`Creating server.js for ${server.name}...`);

        const serverJs = `const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3025;

app.use(express.json({ limit: '50mb' }));

// Identity endpoint for browser extension validation
app.get('/.identity', (req, res) => {
  res.json({
    signature: 'mcp-browser-connector-24x7',
    version: '1.0.0',
    name: 'Browser Tools MCP Server'
  });
});

// Current URL endpoint
app.post('/current-url', (req, res) => {
  const { url, tabId, timestamp, source } = req.body;
  console.log(\`Received URL update: \${url} (Tab: \${tabId}, Source: \${source})\`);
  
  // Store the URL if needed for your application
  
  res.json({ success: true, message: 'URL received', url });
});

// Screenshot endpoint
app.post('/screenshot', async (req, res) => {
  const { data, path } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'No screenshot data provided' });
  }
  
  try {
    console.log(\`Received screenshot data, \${data.length} chars\`);
    // Save screenshot or process it as needed
    // For now, we'll just acknowledge receipt
    
    // Here you would typically save the image to disk or process it
    // const base64Data = data.replace(/^data:image\/png;base64,/, '');
    // require('fs').writeFileSync(path || 'screenshot.png', base64Data, 'base64');
    
    res.json({ 
      success: true, 
      message: 'Screenshot received', 
      path: path || 'screenshot.png' 
    });
  } catch (error) {
    console.error('Error processing screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Browser tools endpoint
app.post('/browser-tools', async (req, res) => {
  const { action, params } = req.body;
  console.log(\`Received request: \${action}\`, params);
  
  try {
    // Handle browser actions here
    res.json({ success: true, message: \`Action \${action} received\` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GitHub API endpoint
app.post('/github', async (req, res) => {
  const { action, params } = req.body;
  console.log(\`Received GitHub request: \${action}\`, params);
  
  try {
    // Handle GitHub actions here
    res.json({ success: true, message: \`GitHub action \${action} received\` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Browser Tools MCP Server is running');
});

app.listen(port, () => {
  console.log(\`Browser Tools MCP Server listening at http://localhost:\${port}\`);
});`;

        fs.writeFileSync(serverJsPath, serverJs);
      }

      // Check if dependencies are installed
      const nodeModulesPath = path.join(serverDir, "node_modules");
      if (!fs.existsSync(nodeModulesPath)) {
        console.log(
          `Installing dependencies for ${server.name} (this may take a moment)...`
        );
        try {
          // Use execSync to ensure this completes before continuing
          execSync("npm install", { cwd: serverDir, stdio: "inherit" });
          console.log("Dependencies installed successfully.");
        } catch (error) {
          console.error("Failed to install dependencies:", error);
          continue; // Skip starting this server if dependencies couldn't be installed
        }
      }
    }

    // Start the server
    console.log(`Starting ${server.name}...`);
    try {
      const serverProcess = spawn(server.startCmd, server.startArgs, {
        cwd: server.directory,
        stdio: "inherit",
        detached: true,
      });

      serverProcess.on("error", (err) => {
        console.error(`Failed to start ${server.name}:`, err);
      });

      console.log(`${server.name} started with PID ${serverProcess.pid}`);

      // Don't wait for child process to exit
      serverProcess.unref();
    } catch (error) {
      console.error(`Error starting ${server.name}:`, error);
      if (server.required) {
        console.error(`Failed to start required server: ${server.name}`);
      }
    }
  }

  console.log("MCP servers startup completed.");
}

// Run the main function
startServers().catch((error) => {
  console.error("Error in startup process:", error);
});

console.log("MCP servers startup initiated.");
console.log(
  "Note: browser-tools-mcp is required for browser automation and GitHub functionality."
);
