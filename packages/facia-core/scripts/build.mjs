#!/usr/bin/env node
import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";

const packageRoot = new URL("../", import.meta.url);
await rm(new URL("dist/", packageRoot), { recursive: true, force: true });

const compiler = spawn("tsc", ["-p", "tsconfig.json"], {
  cwd: packageRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});
const exitCode = await new Promise((resolve, reject) => {
  compiler.once("error", reject);
  compiler.once("exit", resolve);
});
if (exitCode !== 0) process.exitCode = typeof exitCode === "number" ? exitCode : 1;
