const { spawn } = require("child_process");
const path = require("path");

const [service, script = "dev"] = process.argv.slice(2);

if (!service) {
  console.error("Usage: node scripts/run-service.js <backend|frontend> [script]");
  process.exit(1);
}

const cwd = path.join(__dirname, "..", service);
const command = getCommand(service, script);

const child = spawn(command.bin, command.args, {
  cwd,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code || 0);
});

function getCommand(serviceName, scriptName) {
  if (scriptName !== "dev") {
    return {
      bin: process.platform === "win32" ? "npm.cmd" : "npm",
      args: ["run", scriptName],
    };
  }

  if (serviceName === "backend") {
    return {
      bin: process.execPath,
      args: [
        path.join(cwd, "node_modules", "ts-node-dev", "lib", "bin.js"),
        "--respawn",
        "--transpile-only",
        "src/server.ts",
      ],
    };
  }

  if (serviceName === "frontend") {
    return {
      bin: process.execPath,
      args: [path.join(cwd, "node_modules", "next", "dist", "bin", "next"), "dev"],
    };
  }

  console.error(`Unknown service: ${serviceName}`);
  process.exit(1);
}
