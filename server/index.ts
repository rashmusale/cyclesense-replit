/**
 * Simple launcher for Vite dev server
 * This file exists only to satisfy the package.json dev script
 * The actual app is a client-side only static site using localStorage
 */

import { spawn } from "child_process";

console.log("Starting Vite dev server on port 5000...");

const viteProcess = spawn("npx", ["vite", "--port", "5000", "--host"], {
  stdio: "inherit",
  shell: true,
});

viteProcess.on("error", (error) => {
  console.error("Failed to start Vite:", error);
  process.exit(1);
});

viteProcess.on("exit", (code) => {
  process.exit(code || 0);
});
