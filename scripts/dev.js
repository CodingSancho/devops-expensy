const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..");
let shuttingDown = false;

const services = [
  {
    name: "backend",
    cwd: "backend",
    args: [
      path.join(rootDir, "backend", "node_modules", "ts-node-dev", "lib", "bin.js"),
      "--respawn",
      "--transpile-only",
      "src/server.ts",
    ],
  },
  {
    name: "frontend",
    cwd: "frontend",
    args: [
      path.join(rootDir, "frontend", "node_modules", "next", "dist", "bin", "next"),
      "dev",
    ],
  },
];

const children = services.map(({ name, cwd, args }) => {
  const serviceDir = path.join(rootDir, cwd);
  const child = spawn(process.execPath, args, {
    cwd: serviceDir,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => writeOutput(name, data));
  child.stderr.on("data", (data) => writeOutput(name, data));

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    console.log(`[${name}] exited with ${signal || code}`);
    shutdown(code || 1);
  });

  child.on("error", (error) => {
    if (shuttingDown) return;

    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  return child;
});

function writeOutput(name, data) {
  data
    .toString()
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => console.log(`[${name}] ${line}`));
}

function shutdown(code = 0) {
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  process.exit(code);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
