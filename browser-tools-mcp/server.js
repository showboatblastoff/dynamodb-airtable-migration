const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = process.env.PORT || 3025;

app.use(express.json({ limit: "50mb" }));

// Identity endpoint for browser extension validation
app.get("/.identity", (req, res) => {
  res.json({
    signature: "mcp-browser-connector-24x7",
    version: "1.0.0",
    name: "Browser Tools MCP Server",
  });
});

// Current URL endpoint
app.post("/current-url", (req, res) => {
  const { url, tabId, timestamp, source } = req.body;
  console.log(`Received URL update: ${url} (Tab: ${tabId}, Source: ${source})`);

  // Store the URL if needed for your application

  res.json({ success: true, message: "URL received", url });
});

// Screenshot endpoint
app.post("/screenshot", async (req, res) => {
  const { data, path } = req.body;

  if (!data) {
    return res.status(400).json({ error: "No screenshot data provided" });
  }

  try {
    console.log(`Received screenshot data, ${data.length} chars`);
    // Save screenshot or process it as needed
    // For now, we'll just acknowledge receipt

    // Here you would typically save the image to disk or process it
    // const base64Data = data.replace(/^data:image\/png;base64,/, '');
    // require('fs').writeFileSync(path || 'screenshot.png', base64Data, 'base64');

    res.json({
      success: true,
      message: "Screenshot received",
      path: path || "screenshot.png",
    });
  } catch (error) {
    console.error("Error processing screenshot:", error);
    res.status(500).json({ error: error.message });
  }
});

// Browser tools endpoint
app.post("/browser-tools", async (req, res) => {
  const { action, params } = req.body;
  console.log(`Received request: ${action}`, params);

  try {
    // Handle browser actions here
    res.json({ success: true, message: `Action ${action} received` });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GitHub API endpoint
app.post("/github", async (req, res) => {
  const { action, params } = req.body;
  console.log(`Received GitHub request: ${action}`, params);

  try {
    // Handle GitHub actions here
    res.json({ success: true, message: `GitHub action ${action} received` });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Browser Tools MCP Server is running");
});

app.listen(port, () => {
  console.log(`Browser Tools MCP Server listening at http://localhost:${port}`);
});
