#!/usr/bin/env node
/**
 * Testa se o backend está acessível e se o cadastro (register) funciona.
 * Rode com o backend já rodando: node scripts/test-api.js
 */
const BASE = "http://127.0.0.1:3000";

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (e) {
    console.error(`✗ ${name}:`, e.message);
    return false;
  }
}

async function main() {
  console.log("Testando integração com o backend em", BASE, "\n");

  let ok = true;

  await test("GET /health", async () => {
    const res = await fetch(`${BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error("Resposta inválida");
  });

  await test("POST /auth/register (cadastro)", async () => {
    const email = `teste-${Date.now()}@inself.app`;
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "senha123",
        full_name: "Usuário Teste",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.token || !data.user) throw new Error("Resposta sem token ou user");
    console.log("    -> usuário criado:", data.user.email);
  });

  await test("POST /auth/login", async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teste@inself.app",
        password: "qualquersenha",
      }),
    });
    const data = await res.json();
    if (res.status !== 401 && !data.token) throw new Error(data.error || "Esperado 401 ou token");
  });

  console.log("\nSe todos os testes passaram, a API está OK para o app.");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
