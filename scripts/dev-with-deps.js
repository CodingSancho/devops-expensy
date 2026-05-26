const { spawn, spawnSync } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const docker = process.platform === "win32" ? "docker.exe" : "docker";

const compose = spawnSync(docker, ["compose", "up", "-d", "mongo", "redis"], {
  cwd: rootDir,
  stdio: "inherit",
});

if (compose.status !== 0) {
  console.error("Could not start MongoDB and Redis. Is Docker running?");
  process.exit(compose.status || 1);
}

const dev = spawn(process.execPath, [path.join(__dirname, "dev.js")], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
});

dev.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code || 0);
});
