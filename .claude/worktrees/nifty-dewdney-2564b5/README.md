## SimulaMEI

Motor fiscal para MEI com simulação de teto, Fator R, CNAE e comparativo de regimes.

## Setup local

1. Copie `.env.example` para `.env.local`
2. Preencha as variáveis do Supabase
3. Instale as dependências

```bash
npm ci
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run build
npm run cnae:check
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## CI/CD

O projeto possui:

- quality gate com `lint`, `test:coverage` e `build`
- preview deploy automático no Vercel para PRs internas
- deploy de produção no Vercel para push em `main`
- monitor mensal das fontes oficiais de CNAE

Detalhes operacionais em [docs/deployment.md](./docs/deployment.md).
