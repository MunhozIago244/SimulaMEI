# Deploy e CI/CD

## Variáveis do app

Copie `.env.example` para `.env.local` no ambiente local.

Campos obrigatórios:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_HASH_SECRET`
- `NEXT_PUBLIC_APP_URL`

## GitHub Actions

O repositório usa:

- `.github/workflows/ci-vercel.yml`
- `.github/workflows/cnae-official-sync.yml`

### Quality gate

Toda PR para `main` e todo push em `main` executam:

- `npm run lint`
- `npm run test:coverage`
- `npm run build`

O deploy no Vercel só roda depois desse gate passar.

## Vercel Preview e Production

O workflow `ci-vercel.yml` usa Vercel CLI para:

- criar preview deploy automático em toda PR interna
- publicar em produção a cada push em `main`

### Secrets necessários no GitHub

Configure estes secrets no repositório:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Como obter os valores

1. `VERCEL_TOKEN`: Vercel Dashboard -> Settings -> Tokens
2. `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`: depois de linkar o projeto via `vercel link`, veja `.vercel/project.json`

### Observações operacionais

- PRs vindas de fork não recebem preview deploy neste workflow, porque GitHub não expõe secrets para forks.
- O workflow comenta a URL de preview na própria PR.
- `NEXT_PUBLIC_APP_URL` de produção deve apontar para o domínio final do projeto.
- Se a Git Integration nativa do Vercel já estiver ativa para este repositório, desative esse caminho ou o workflow de deploy para evitar deploys duplicados.
