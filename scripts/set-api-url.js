#!/usr/bin/env node
/**
 * Define EXPO_PUBLIC_API_URL para o IP da sua máquina na rede local.
 * Use quando for testar no celular físico (localhost não funciona no aparelho).
 * Rode: node scripts/set-api-url.js
 * Depois: npx expo start -c
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
let ip = "localhost";

const ifaces = os.networkInterfaces();
for (const name of Object.keys(ifaces)) {
  for (const i of ifaces[name]) {
    if (i.family === "IPv4" && !i.internal) {
      ip = i.address;
      break;
    }
  }
  if (ip !== "localhost") break;
}

const url = `http://${ip}:3000`;
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
if (content.includes("EXPO_PUBLIC_API_URL=")) {
  content = content.replace(/EXPO_PUBLIC_API_URL=.*/g, `EXPO_PUBLIC_API_URL=${url}`);
} else {
  content = (content.trim() ? content + "\n" : "") + `EXPO_PUBLIC_API_URL=${url}\n`;
}
fs.writeFileSync(envPath, content);
console.log("Atualizado .env com:", url);
console.log("Reinicie o Expo com: npx expo start -c");
