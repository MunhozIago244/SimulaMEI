# AGENTS.md — SimulaMEI

## Ambiente

- **OS**: Windows 11 com PowerShell
- **Shell**: PowerShell — NUNCA use comandos Unix (`tail`, `grep`, `cat`, `ls`, `rm`, etc.)
  - Use equivalentes PowerShell: `Get-Content -Tail`, `Select-String`, `Get-Content`, `Get-ChildItem`, `Remove-Item`
- **Node**: verifique a versão com `node -v` antes de instalar dependências
- **Package manager**: npm (use `npm run` para scripts)

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript (strict)
- **Estilização**: Tailwind CSS v4
- **Banco de dados**: Supabase (PostgreSQL)
  - Client-side: `@supabase/ssr` para Server Components e Route Handlers
  - Nunca exponha a service role key no cliente
- **Testes**: Vitest (`npm run test`)
- **Linting**: ESLint (`npm run lint`)

## Estrutura do projeto

```
src/
  app/          → páginas e rotas (App Router)
  components/
    ui/         → componentes genéricos (Badge, Tag, MonoVal, Divider, etc.)
    resultado/  → componentes de resultado fiscal
    layout/     → seções de layout (Hero, HowWeCalculate, etc.)
  lib/
    tributario/ → lógica de cálculo tributário (MEI, Simples, Presumido, Fator R)
    format.ts   → utilitários de formatação
```

## Regras de código

- Sempre usar os tipos existentes antes de criar novos — verifique `src/lib/tributario/` antes de definir interfaces
- Nomes de campos seguem o padrão já usado no código — leia o arquivo antes de editar
- Componentes em `src/components/ui/` são exportados via `index.ts` — importe sempre de lá
- Após qualquer edição em imports ou múltiplos arquivos, rode `npm run build` e corrija todos os erros antes de continuar

## Fluxo de trabalho

1. **Antes de editar**: leia o arquivo alvo para entender a estrutura e convenções
2. **Após cada edição com imports**: rode `npx tsc --noEmit` para checar tipos
3. **Antes de commitar**: rode `npm run build` e `npm run test` — só commite se ambos passarem
4. **Build command**: `npm run build`
5. **Dev server**: `npm run dev` (porta 3000)

## Supabase

- Variáveis de ambiente ficam em `.env.local` (nunca commitar)
- Migrações SQL devem ser testadas localmente antes de aplicar em produção
- Ao adicionar colunas, sempre verifique se os tipos TypeScript gerados estão atualizados

## Commits

- Mensagens em português, imperativo: `Corrige cálculo do Fator R para serviços`
- Nunca commitar arquivos `.env`, `.env.local`, ou chaves de API
