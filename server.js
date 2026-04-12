import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// API routes
app.get("/api/count", async (req, res) => {
  const { default: handler } = await import("./api/count.js");
  return handler(req, res);
});

app.post("/api/subscribe", async (req, res) => {
  const { default: handler } = await import("./api/subscribe.js");
  return handler(req, res);
});

// Fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Landing server running on port ${PORT}`);
});