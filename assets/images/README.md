# Imagens (estrutura Inself)

Use esta pasta para imagens do app:

- **logo.png** — logo principal (ex.: header, auth). Recomendado: fundo transparente, ~200–400px de largura.
- **placeholder.png** ou **placeholder.svg** — imagem padrão para cards ou conteúdo vazio.

No código, importe com:

```ts
import logo from "@/assets/images/logo.png";
// ou
const logo = require("@/assets/images/logo.png");
```

Para ícones do app (splash, app icon), use os arquivos na raiz de `assets/` conforme o README principal.
