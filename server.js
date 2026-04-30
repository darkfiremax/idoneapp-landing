import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Rewrites (migrated from vercel.json)
app.get("/terminos", (req, res) => res.sendFile(path.join(__dirname, "terminos.html")));
app.get("/privacidad", (req, res) => res.sendFile(path.join(__dirname, "privacidad.html")));
app.get("/seguridad", (req, res) => res.sendFile(path.join(__dirname, "seguridad.html")));

// API routes
app.get("/api/count", async (req, res) => {
  const { default: handler } = await import("./api/count.js");
  return handler(req, res);
});

app.post("/api/subscribe", async (req, res) => {
  const { default: handler } = await import("./api/subscribe.js");
  return handler(req, res);
});

// Fallback to 404.html
app.get("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.listen(PORT, () => {
  console.log(`Landing server running on port ${PORT}`);
});