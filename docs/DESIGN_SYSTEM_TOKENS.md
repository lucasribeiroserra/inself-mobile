# Design system — tokens de UI (InSelf Mobile)

**Objetivo de produto:** conseguir alterar **100% do visual** do aplicativo (cores, tipografia base, raios, sombras e espaçamentos de design system) editando **apenas** os ficheiros de tema **light** e **dark**, sem percorrer ecrãs nem componentes.

**Estado hoje:** o repositório ainda não cumpre totalmente este objetivo (há hex espalhado e duplicação). Este documento define a **fonte de verdade**, os **nomes dos tokens**, as **regras de código** e o **alinhamento com a Fase F.4** (unificação `ThemeContext` / `SettingsContext`).

---

## 1. Conceitos: paleta vs modo claro/escuro

| Conceito | O que é | Onde vive |
|----------|---------|-----------|
| **Paleta (tokens)** | Valores de cor, sombra, raio, escala tipográfica do DS | Ficheiros de tema (secção 2) |
| **Modo (light / dark)** | Qual paleta está ativa para o utilizador | `ThemeContext` + preferência em `/settings` (após F.4: uma só fonte) |
| **Comportamento de UI** | Lógica de negócio, layout, animações | Componentes e ecrãs — **sem** redefinir cores hex |

**Regra:** `ThemeContext` e `SettingsContext` não devem conter **definições de cor**; apenas **estado** (`theme: "light" \| "dark"`), persistência e sync com API. As cores vêm sempre dos **tokens** (classes NativeWind ou API de tema para `StyleSheet`).

---

## 2. Fonte de verdade (estado alvo)

### 2.1 Ficheiros únicos para “todo o visual”

**Alvo (após refatoração):**

| Ficheiro | Conteúdo |
|----------|----------|
| `lib/theme/palette.light.ts` | Objeto tipado com **todos** os tokens semânticos do modo claro (hex ou HSL string) |
| `lib/theme/palette.dark.ts` | Idem para modo escuro |
| `lib/theme/index.ts` | Re-export, helpers `getPalette(mode)`, mapeamento para ícones/`StyleSheet` se necessário |

**`tailwind.config.js`** importa `palette.light` e `palette.dark` e monta `theme.extend.colors` (prefixo `dark-*` para variantes escuras ou estratégia `class` + duas escalas — a equipa escolhe uma convenção e mantém-na).

**Tipografia e motion** (também parte do “visual global”):

| Ficheiro | Conteúdo |
|----------|----------|
| `lib/theme/typography.ts` | Escala `fontSize` / `lineHeight` alinhada ao que hoje está em `tailwind.config.js` |
| `lib/theme/radius.ts` | `borderRadius` |
| `lib/theme/shadows.ts` | `boxShadow` (incl. variantes dark) |
| `lib/theme/spacing.ts` | `spacing` extra do projeto |

**Contrato:** qualquer alteração visual de DS passa por **estes ficheiros** + o **único** `tailwind.config.js` que os consome (sem duplicar hex noutros sítios).

> **Nota:** até a refatoração existir, a fonte de verdade **de facto** é `tailwind.config.js` + `global.css` (variáveis) + `lib/themeDark.ts` (legado). A dívida é eliminar `themeDark` e hex nos componentes, consolidando em `lib/theme/palette.*.ts`.

### 2.2 `global.css` (web / variáveis CSS)

- Mantém-se como **espelho opcional** das variáveis para ambientes que usem CSS (ex. documentação web).
- **Não** deve ser a fonte primária de verdade para RN se `palette.*.ts` + Tailwind forem o contrato; idealmente gerado ou copiado a partir dos mesmos tokens (ou documentado como secundário).

---

## 3. Nomes dos tokens (semânticos)

Os nomes abaixo alinham com o uso atual em **NativeWind** (`className`). **Não usar** nomes de cor de marca cru (“verde InSelf”) nos componentes — usar estes tokens.

### 3.1 Modo claro (classes sem prefixo)

| Token Tailwind | Uso típico |
|----------------|------------|
| `background` | Fundo de ecrã |
| `foreground` | Texto principal |
| `card` / `card-foreground` | Superfícies elevadas |
| `popover` / `popover-foreground` | Modais, menus |
| `primary` / `primary-foreground` | Ações principais, CTAs |
| `secondary` / `secondary-foreground` | Ações secundárias |
| `muted` / `muted-foreground` | Fundos suaves, texto secundário |
| `accent` / `accent-foreground` | Destaques |
| `destructive` / `destructive-foreground` | Erro, ações perigosas |
| `success` / `success-foreground` | Sucesso (onde aplicável) |
| `border`, `input`, `ring` | Contornos, inputs, foco |
| `sidebar.*` | Tokens do padrão “sidebar” (se usado) |

### 3.2 Modo escuro (prefixo `dark-`)

Usados com prefixo de classe `dark:` (ex.: `dark:bg-dark-bg`, `dark:text-dark-fg`).

| Token | Uso típico |
|-------|------------|
| `dark-bg` | Fundo |
| `dark-fg` | Texto principal |
| `dark-card` | Cartões |
| `dark-popover` | Popovers |
| `dark-muted` / `dark-muted-fg` | Muted |
| `dark-border` / `dark-border-light` / `dark-border-heavy` | Hierarquia de bordas |
| `dark-primary` / `dark-primary-fg` | Primário |
| `dark-badge-info` / `dark-badge-warning` / `dark-badge-success` / `dark-badge-error` | Badges e estados |

### 3.3 Tipografia (famílias)

Definidas em `tailwind.config.js` → **alvo:** `lib/theme/typography.ts`.

| Token | Família (hoje) |
|-------|----------------|
| `font-serif` | Cormorant Garamond (títulos) |
| `font-body` | DM Sans regular |
| `font-body-light` | DM Sans light |

Os ficheiros de fonte continuam a ser carregados em `app/_layout.tsx` (`@expo-google-fonts`); **alterar a marca** pode exigir trocar o pack de fontes **e** o token `fontFamily` no tema — documentar no PR.

### 3.4 Raio, sombras, espaçamento extra

| Categoria | Tokens (exemplos) |
|-----------|-------------------|
| `borderRadius` | `rounded-sm`, `rounded-md`, `rounded-lg` (valores em `tailwind.config.js`) |
| `boxShadow` | `dark-sm`, `dark-md`, `dark-lg`, `dark-elegant` |
| `spacing` | `4.5`, `13`, `15`, `18` |

---

## 4. Regra: “sem hex fora de X ficheiros”

### 4.1 Lista fechada (permitir literais `#` / `rgb` / `hsl`)

Até existir `lib/theme/palette.*.ts`, a lista **mínima** permitida é:

1. `tailwind.config.js` — todas as cores e sombras do DS  
2. `global.css` — variáveis `:root` / `.dark` (se mantidas; alinhar com paleta)  
3. `lib/themeDark.ts` — **deprecated**; remover quando `palette.dark.ts` + consumo unificado existirem  

**Alvo após refatoração** (lista fechada):

1. `lib/theme/palette.light.ts`  
2. `lib/theme/palette.dark.ts`  
3. `lib/theme/typography.ts` (se usar px/rem explícitos)  
4. `lib/theme/radius.ts`  
5. `lib/theme/shadows.ts`  
6. `lib/theme/spacing.ts`  
7. `tailwind.config.js` — apenas **importa** os objetos acima e mapeia para `theme.extend` (sem hex hardcoded no corpo do config, idealmente)

### 4.2 Proibido em `app/`, `components/`, `contexts/`

- Literais de cor: `#RRGGBB`, `rgb()`, `rgba()`, `hsl()` (exceto assets SVG externos se inevitável)  
- `PlatformColor` com valores fixos que dupliquem a paleta  

**Exceções documentadas:**

- **Ícones vectoriais** (`@expo/vector-icons`): usar `color={...}` com valor vindo de **`useThemeColors()`** ou classe equivalente — não hex inline.  
- **Bibliotecas de terceiros** que exijam cor obrigatória: encapsular num componente wrapper que lê tokens.

### 4.3 Como aplicar nos PRs

- CI ou `eslint` (ex. `no-restricted-syntax` / regex em cor) pode alertar para `#` em pastas proibidas.  
- Code review: rejeitar novos hex fora da lista fechada.

### 4.4 Conflito `darkMode: "media"` vs toggle manual

**Problema atual:** `tailwind.config.js` usa `darkMode: "media"`, que faz NativeWind seguir `prefers-color-scheme` do sistema operativo. Porém o app tem toggle manual via `ThemeContext` que chama `Appearance.setColorScheme()`. Se o SO mudar o color scheme, pode sobrescrever a preferência do utilizador.

**Ação (Fase D.5):** trocar para `darkMode: "class"` com controlo explícito pelo `ThemeContext`. Isto garante que o dark mode é determinado exclusivamente pela preferência do utilizador, não pelo sistema.

### 4.5 Inconsistência `useColorScheme` vs `useTheme`

**Problema atual:** `app/(tabs)/_layout.tsx` (TabLayout) usa `useColorScheme()` do React Native para decidir cores das tabs, enquanto todos os outros ecrãs usam `useTheme()` do contexto customizado. Isto pode causar dessincronização visual entre as tabs e o conteúdo dos ecrãs.

**Ação (Fase D.4):** substituir `useColorScheme()` por `useTheme()` no TabLayout, e eliminar cores hex hardcoded no `tabBarActiveTintColor` / `tabBarInactiveTintColor` (usar tokens do tema em vez disso).

### 4.6 Tripla fonte de verdade para dark mode (estado actual)

Hoje existem **três ficheiros** que definem cores do modo escuro de forma independente:

| Fonte | Formato | Ficheiro |
|-------|---------|----------|
| Variáveis CSS `.dark` | HSL (ex.: `220 15% 10%`) | `global.css` |
| Tokens Tailwind `dark-*` | Hex (ex.: `#16181D`) | `tailwind.config.js` |
| Objeto JS `darkColors` | Hex (ex.: `"#16181D"`) | `lib/themeDark.ts` |

E nos componentes, a decisão é inline: `isDark ? darkColors.primary : "#5A7A66"`. Uma mudança de paleta exige alterar os 3 ficheiros + varrer hex hardcoded em dezenas de componentes.

**Ação:** consolidar numa única fonte (`lib/theme/palette.dark.ts`) conforme secção 2.1, e fazer `tailwind.config.js` + `global.css` derivarem dessa fonte.

---

## 5. Objetivo “100% visual só com light + dark”

**Definição de pronto:**

1. Todos os ecrãs e componentes usam apenas:
   - classes `text-*`, `bg-*`, `border-*`, `dark:*` mapeadas para tokens; **ou**
   - `StyleSheet.create` alimentado por `getPalette(isDark)` / hook que lê os mesmos objetos que o Tailwind.  
2. Não existe `isDark ? "#5A7A66" : "#..."` — substituir por `colors.primary` do tema ativo.  
3. `lib/themeDark.ts` é removido ou reduzido a re-export do `palette.dark`.  
4. `tailwind.config.js` não duplica valores já definidos em `palette.*.ts` (single source).
5. Nenhum componente usa `useColorScheme()` do RN para decidir cores — apenas `useTheme()` ou classes NativeWind `dark:`.
6. `tailwind.config.js` usa `darkMode: "class"` (não `"media"`).

**Checklist de migração (incremental):**

- [ ] Criar `lib/theme/palette.light.ts` e `palette.dark.ts` com os valores atuais de `tailwind.config.js` + `themeDark.ts`  
- [ ] Fazer `tailwind.config.js` consumir esses ficheiros  
- [ ] Introduzir `useThemeColors()` (ou similar) para ícones e `StyleSheet`  
- [ ] Substituir hex em `app/` e `components/` por tokens  
- [ ] Remover `lib/themeDark.ts`  
- [ ] Opcional: reduzir `global.css` a espelho gerado ou documentar como secundário  

---

## 6. Alinhamento com Fase F.4 — `ThemeContext` / `SettingsContext`

A F.4 (ver [`PLANO_ARQUITETURA.md`](./PLANO_ARQUITETURA.md) e [`FASES_STEPS_E_CHECKLIST_PR.md`](./FASES_STEPS_E_CHECKLIST_PR.md)) unifica **leitura/escrita de `/settings`** e evita dupla hidratação entre contextos.

**Como isto relaciona com tokens:**

| Responsabilidade | Dono |
|------------------|------|
| **Quais** são as cores/tipografia do app | `lib/theme/*` + Tailwind |
| **Se** o utilizador está em light ou dark | Um único fluxo: Query/cache ou context derivado de `/settings.theme` |
| **Persistência** do modo | API `/settings` + cache local se necessário (sem segundo fetch concorrente) |

**Anti-padrão:** `ThemeContext` decidir cores ou duplicar valores de `themeDark` / hex.  
**Padrão:** `ThemeContext` expõe `resolvedMode: "light" | "dark"`; componentes e ícones consomem **tokens** para esse modo.

**Dependências de Fase D a resolver antes ou em paralelo com F.4:**

- **D.4:** `useColorScheme` -> `useTheme` no TabLayout (evitar dessincronização ao unificar fonte de tema).
- **D.5:** `darkMode: "class"` no Tailwind (pré-requisito para que o toggle funcione correctamente com a query unificada de settings).

---

## 7. Referências no repositório (hoje)

| Área | Ficheiro |
|------|----------|
| Cores + tipografia Tailwind | `tailwind.config.js` |
| Variáveis CSS (base web) | `global.css` |
| Hex dark para JS (legado) | `lib/themeDark.ts` |
| Carregamento de fontes | `app/_layout.tsx` |
| Modo claro/escuro + PATCH tema | `contexts/ThemeContext.tsx` |
| Settings incl. tema no servidor | `contexts/SettingsContext.tsx` |

---

## 8. Histórico

| Data | Nota |
|------|------|
| 2026-03-19 | Criação do documento: fonte de verdade alvo, nomes de tokens, regra de hex, F.4, objetivo 100% via ficheiros light/dark. |

---

*Este documento complementa [`PLANO_ARQUITETURA.md`](./PLANO_ARQUITETURA.md) e [`ARQUITETURA_CORPORATIVA.md`](./ARQUITETURA_CORPORATIVA.md); não substitui decisões de produto sobre conteúdo ou UX.*
