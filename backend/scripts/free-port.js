#!/usr/bin/env node
/**
 * Libera a porta 3000 se estiver em uso por outro processo Node (evita EADDRINUSE).
 * Só encerra processos em execução em src/index.js para não matar outros apps.
 */
import { execSync } from "child_process";
import { platform } from "os";

const PORT = process.env.PORT || 3000;

if (platform() !== "darwin" && platform() !== "linux") {
  process.exit(0);
}

try {
  const out = execSync(`lsof -ti :${PORT}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  const pids = out.trim().split(/\s+/).filter(Boolean);
  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`Porta ${PORT} liberada (PID ${pid}).`);
    } catch (_) {}
  }
} catch (_) {
  // Nenhum processo na porta
}
